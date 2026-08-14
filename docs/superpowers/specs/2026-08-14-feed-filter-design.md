# フィードの絞り込み — 設計メモ

*2026-08-14 / 承認済み*

## 何を解決するのか

フィードは好みの学習エンジンが並べ替えているだけで、**除外**はできない。メンズしか着ない人の前にもレディースが出るし、いま探しているのがアウターだけでも、他のカテゴリーが同じ確率で現れる。学習は「並び順」しか動かせないので、そもそも見たくないものを消す手段が要る。

探す（`/lookbook`）にはすでに絞り込みがある。同じものをフィードにも置く。

## 範囲

**入れるもの:** 性別（レディース / メンズ / すべて）、カテゴリー（1つ選択 / すべて）。

**入れないもの、およびその理由:**

- **並び替え** — フィードの並び順は好みの学習エンジンのものであり、選択肢のひとつとして並べると「エンジンは数ある並び順の一種」という誤解を与える。`filter-fab.tsx` で `おすすめ順` を消したときと同じ判断。
- **在庫** — カード自体が在庫状況を出しているので、隠す価値が薄い。
- **価格帯・ブランド** — シードのカタログは9商品・4ブランド。ひと押しでフィードが空になる。

## 保存場所 — cookie

`hitome_feed_filter`（httpOnly / sameSite=lax / 1年）。名前に `:` を使わないのは、RFC 6265 のトークンとして不正で、シリアライザによっては拒否されるため。既存の `swipefash_session` と同じ書き方に揃える。

理由: フィードは下部ナビの「フィード」から入る。リンク先は素の `/feed` なので、探すと同じクエリ文字列方式にすると**タブを移動するたびに絞り込みが消える**。cookie ならサーバー側で読めるので、SSR の結果が最初から正しく、ちらつきもない。

データベースに置く案は見送った。新しいカラムとマイグレーション、そしてフィードを開くたびのクエリが1本増える。絞り込みは端末ごとの一時的な好みであって、アカウントに属する資産ではない。

## モジュール構成

### `lib/feed-filter.ts`（純粋・DBに触れない）

```ts
export type FeedFilter = { gender?: "women" | "men"; category?: string };

export const FEED_FILTER_COOKIE = "hitome:feed-filter";

export function parseFeedFilter(raw: string | undefined): FeedFilter;
export function serializeFeedFilter(filter: FeedFilter): string;
export function countActiveFeedFilters(filter: FeedFilter): number;
```

cookie は利用者が書き換えられる。`parseFeedFilter` は**知らない値を捨てる**。性別は `women` / `men` の完全一致のみ。カテゴリーは `^[a-z][a-z0-9-]{0,31}$` の形だけを通す。存在しないスラッグは通過しうるが、その場合クエリの結果が0件になるだけで、害はない。

`lib/taste.ts` などと同じく、データベースのハーネスなしで単体テストできる。

### `app/actions.ts` に `setFeedFilterAction`

受け取った値を `serializeFeedFilter` → `parseFeedFilter` に通してから cookie に書く。クライアントから来た値をそのまま信じない。

### `app/feed/page.tsx`

cookie を読み、`listProducts({ category, gender, limit: 10, sessionId, rankByTaste: true })` に渡す。**データ層の変更はゼロ** — この3つの引数はすでに実装されている。`listCategories()` は同じ `Promise.all` に入れるので、待ち時間は増えない。

絞り込みは SQL の**固い制約**、好みの学習エンジンはその中での**並び順**。両者は競合しない。

### 凍結されたデッキ

`SwipeFeed` はマウント時に `deck` を凍結するので、新しい props は無視される。凍結のロジックには触れず、`key` を与えて解決する:

```tsx
<SwipeFeed key={`${gender ?? ""}-${category ?? ""}`} products={products} />
```

絞り込みが変われば key が変わり、React が作り直し、新しい一覧からデッキが凍結され、インデックスは0に戻る。

### コンポーネント

`filter-fab.tsx` は「浮かぶボタンの機構」（ドラッグ・境界・クリック抑止・バッジ・ドロワー）と「探す専用の中身」を1つに混ぜている。フィードには同じ機構と違う中身が要る。

- `components/filter-fab-shell.tsx` — 機構だけ。`activeCount`、`title`、位置、そして中身を受け取る。
- `components/filter-fab.tsx` — 探す用の中身（並び替え・在庫）。
- `components/feed-filter-fab.tsx` — フィード用の中身（性別・カテゴリー）。

`mode="feed" | "lookbook"` の1コンポーネント案は却下。どちらかのページが変わるたびに内部の分岐が増える。

### 既定の位置

`bottom-[calc(var(--nav-clearance)+4.5rem)] right-5` — 「いいね！」ボタンの**上**。画面下部はすでにボタンとナビが占めている。探すと同じくドラッグで動かせる。

### 空の状態

カタログが9商品なので、メンズ × ワンピースは0件になる。現在の文言「今日はここまで。新着はまた入荷します」は、原因が絞り込みのときには**嘘**になる。`SwipeFeed` に2つ目の空状態を足す: 「この条件に合う服がありません」＋「絞り込みを解除」。これが `SwipeFeed` への唯一の変更。

## テスト

`lib/feed-filter.test.ts` — 正しい値の解釈、でたらめな値の拒否、serialize→parse の往復、空の cookie。UI のテストはこのリポジトリの慣習どおり書かない。
