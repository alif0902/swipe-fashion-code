# HITOME — 作品概要 / Ringkasan Karya

企画書の「作品概要」ページ用。すべてコードから確認した内容のみ。
Semua isi di sini sudah diverifikasi langsung dari repo — tidak ada yang dikarang.

調査日: 2026年8月14日 / 最終コミット: 2026-08-04

---

## 1. 一言で

> **HITOME（ひとめ）— スワイプで出会う、次の一着**
>
> 選ぶのではなく、感じる。検索窓を一つも持たないファッションEC。

**Bahasa Indonesia** — HITOME adalah aplikasi belanja fashion mobile-first tanpa
satu pun kolom pencarian. Pengguna menggeser kartu produk seperti aplikasi
kencan, dan urutan feed mengikuti keputusan itu secara langsung.

---

## 2. 作品概要（企画書に貼れる本文）

本作品「HITOME」は、**検索窓を一つも持たないファッションEC**である。利用者は画面いっぱいに
表示された一着に対し、右（欲しい）・左（見送る）・「いいね！」（保存）の三択で応える。
言葉で条件を組み立てる必要はなく、判断は反応として行われる。

技術的な中核は二つある。第一に、**左スワイプを推薦の学習に使うこと**。通常のECでは捨てられる
「選ばなかった」という判断に −1 の重みを与え、好みの範囲を両側から推定する。第二に、
**同じデータを店側に返すこと**。利用者の好み推定に使う `swipes` テーブルを集計方向から
読み直すと、「見られたが選ばれなかった商品」という、売上表には決して現れない数字になる。

実装は Next.js 16（App Router / React 19）と PostgreSQL による単一の Web アプリケーションで、
PWA としてホーム画面に追加できる。会員登録なしでスワイプから注文まで完結し、登録した時点で
匿名セッションの履歴が引き継がれる。管理画面（PC）では商品ごとの「いいね率」が、見送られた
回数の多い順に表示される。

---

## 3. 解決する課題

| | 内容 |
|---|---|
| **現状** | 衣類・服装雑貨のBtoC EC市場は 2兆7,980億円、EC化率は **23.38%**（経産省 2025年8月公表）。裏を返せば、**まだ8割近くが店舗で買われている**。 |
| **仮説** | 「見たいものがない」のではなく「**探し方がわからない**」。検索窓は、欲しいものを言葉にできる人にしか使えない。 |
| **本作の答え** | 判断を「言葉」から「反応」へ移す。条件を入力させず、一着ずつ見せて反応だけを受け取る。 |

---

## 4. 使用技術 / Tech Stack

### 4-1. フロントエンド

| 技術 | バージョン | 役割・選定理由 |
|---|---|---|
| **Next.js** | 16.2.10 | App Router。Server Components でDB直読み、Server Actions で書き込み。API層を別に作らずに済む |
| **React** | 19.1.0 | — |
| **TypeScript** | 5.9.3 | 全ワークスペースで strict。`npm run typecheck` がビルドの前段に入る |
| **Tailwind CSS** | 4.1.14 | PostCSS 経由（`@tailwindcss/postcss`）。設定ファイルを持たない v4 方式 |
| **Framer Motion** | 12.23.24 | スワイプのドラッグ・慣性・マッチ演出。カードが指に追従する感触の中心 |
| **Radix UI** | Label / Slot / Toast | アクセシビリティ済みの土台のみ採用。見た目は全部自前 |
| **Vaul** | 1.1.2 | 下から出るシート（購入・決済・レビュー・認証）。iOS のシート挙動に寄せてある |
| **lucide-react** | 0.545.0 | アイコン |
| **class-variance-authority / clsx / tailwind-merge** | — | クラス合成。shadcn/ui 系の構成だが、コンポーネントは `components/ui/` に自前で6点だけ |
| **tw-animate-css** | 1.4.0 | アニメーションユーティリティ |

### 4-2. バックエンド・データ

| 技術 | バージョン | 役割・選定理由 |
|---|---|---|
| **PostgreSQL（Supabase）** | — | 本番は `ap-southeast-2`（Sydney）。ランタイムは transaction pooler（6543）、マイグレーションは direct（5432） |
| **Drizzle ORM** | 0.45.2 | スキーマを TypeScript で定義し、型が SQL から直接生える。`$inferSelect` で手書きの型定義がゼロ |
| **drizzle-kit** | 0.31.10 | `db:push` によるスキーマ反映 |
| **drizzle-zod** | 0.8.3 | テーブル定義から Zod スキーマを生成。DB と検証の二重管理を避ける |
| **Zod** | 3.25.76 | Server Actions の入力検証 |
| **Better Auth** | 1.6.25 | メール＋パスワード（最低8文字）。パスワードはハッシュ化して保存（ライブラリ標準の方式、自前実装なし）。セッションは Cookie キャッシュ5分。Drizzle アダプタ経由 |
| **Vercel Blob** | 2.6.1 | 商品写真・プロフィール写真の保存先。Vercel はファイルシステムが読み取り専用のため必須 |
| **sharp** | （next 経由） | 画像最適化。`.npmrc` で install script を切っているため `npm run rebuild:native` で明示ビルド |

### 4-3. インフラ・運用

| 技術 | 内容 |
|---|---|
| **Vercel** | Root Directory = `artifacts/swipe-fashion-next`。設定は `vercel.json` に固定。**Functions region = syd1** に合わせてある（DBと同居させないと1クエリごとに太平洋を往復して200〜250ms） |
| **PWA** | `app/manifest.ts`。`display: standalone` / `start_url: /feed` / アイコン3種（192・512・maskable 512） |
| **npm workspaces** | `artifacts/*`（アプリ）／ `lib/*`（DB）／ `scripts`（運用CLI）の3層モノレポ |
| **Node.js** | >= 22 |

### 4-4. 開発ツール

| ツール | 用途 |
|---|---|
| **Vitest** 3.2.4 | ユニットテスト。**97ケース / 5ファイル**（`taste` 26・`validation` 27・`payment` 26・`format` 12・`size-chart` 6） |
| **Prettier** 3.9.5 | 整形 |
| **tsx** 4.21.0 | 運用スクリプトの実行 |
| **Git** | 69コミット（2026-07-21 〜 2026-08-04） |

---

## 5. アーキテクチャ

```
リポジトリ（npm workspaces）
├── artifacts/swipe-fashion-next   … Next.js アプリ本体
│   ├── app/         14ページ（/feed, /lookbook, /obsessed, /orders,
│   │                /account, /footprints, /likes, /product/[id], /admin…）
│   ├── components/  33コンポーネント（うち ui/ が7点）
│   └── lib/         15モジュール（taste, data, auth, claim, payment,
│                    size-chart, admin-stats, storage, validation…）
├── lib/db                          … スキーマ単一定義（7ファイル）
└── scripts                         … 運用CLI 10本（seed, sync-products,
                                      dedupe-products, make-admin…）
```

**データの流れ**

```
ブラウザ
  ↓ スワイプ
Server Action（app/actions.ts）
  ↓ INSERT ... ON CONFLICT
swipes テーブル
  ├─→ lib/taste.ts  → 一人分の好み → feed の並び順
  └─→ lib/admin-stats.ts → 集計 → 管理画面の「いいね率」
```

同じ1テーブルが、読む方向を変えるだけで**二つの異なる問い**に答える。
分析専用テーブルは作っていない。

**規模** — TypeScript/TSX **102ファイル・約13,500行**（node_modules 等を除く）。

---

## 6. データ設計

| テーブル | 役割 | 設計上の要点 |
|---|---|---|
| `products` | 商品 | `dimensions` は jsonb — トップスとボトムスで採寸項目が違うため。`stock >= 0` の CHECK 制約 |
| `categories` | カテゴリー | dresses / outerwear / tops / bottoms の4種 |
| **`swipes`** | **全スワイプ判断** | `pass` / `like` / `super` の3値 enum。**左スワイプも必ず記録**。(session, product) にユニーク制約 — やり直しは更新であって重複ではない |
| `super_likes` | 一目惚れ | (session, product) ユニーク |
| `orders` | 注文 | status 5値・payment_status 3値。在庫引き当ては注文と同一トランザクション |
| `reviews` | レビュー | 1〜5の CHECK 制約。`sessionId` null = seed 由来。評価は加重平均で更新 |
| `user` / `session` / `account` / `verification` | Better Auth | 住所は日本の住所形式に合わせて5列に分割（郵便番号・都道府県・市区町村・番地・建物） |
| `admin_audit_log` | 管理操作の記録 | user への FK を**あえて張らない** — アカウント削除後も監査記録は残る必要がある |

**匿名セッションの扱い** — middleware が `crypto.randomUUID()` を httpOnly Cookie に発行
（有効期限1年）。ログインセッション（Better Auth の `session` テーブル）とは別物で、コード上は
`anonId` と呼び分けている。

---

## 7. 中核ロジック — 好み推定エンジン（`lib/taste.ts`）

**純粋関数モジュール**。DB もクッキーも触らず、引数だけで完結するのでユニットテストできる。

**スワイプの重み**

| 操作 | 重み |
|---|---|
| いいね！（super） | **+3** |
| 右スワイプ（like） | **+1** |
| 左スワイプ（pass） | **−1** |

**評価軸の重み**

| 軸 | 重み |
|---|---|
| カテゴリー | ×3 |
| ブランド | ×2 |
| 色 | ×1.5 |
| 価格帯 | ×1 |

**設計上の判断（審査で説明できるようにしておく点）**

1. **参照するのは直近5スワイプのみ**（`RECENT_WINDOW = 5`）。信頼度は5回で 1.0。
   蓄積して賢くなる設計では**ない** — その日の気分に追従することを優先した。約10秒でフィードが変わる。
2. **価格帯だけは左スワイプを反映しない**（`weight > 0` の条件）。見送った商品の価格は
   予算を語らない — デザインが理由かもしれないため。
3. **親和度は各次元の最大値で正規化**（−1〜+1）。3スワイプの人と300スワイプの人で
   スケールが揃う。
4. **ソートは安定ソート**。同点は入力順を保つのでフィードが決定的になり、テストできる。
5. **`explainRanking()`** — なぜこの商品が上に来たかを一言で返す。好みから外れている場合は
   正直に「好みからは少し外れています」と言う。

---

## 8. 実装済み機能

**利用者側（モバイル）** — 下部ナビ5つ

| 画面 | 主な機能 |
|---|---|
| フィード `/feed` | 一着表示・左右スワイプ・いいね！・マッチ演出・上スクロールで基本情報・初回チュートリアル3段階 |
| 探す `/lookbook` | 性別タブ・カテゴリー絞り込み・並び替え（新着／価格）・URL連動。**検索窓なし** |
| 一目惚れ `/obsessed` | 保存した商品のグリッド・購入への直行・削除 |
| バッグ `/orders` | 購入シート（サイズガイド付き）・決済シート5種・注文管理 |
| マイページ `/account` | 足あと・いいね！履歴・お届け先・アバター |

**サイズガイド** — 身長・胸囲（ボトムスはウエスト）から S/M/L を引ける早見表。
その商品が**実際に販売しているサイズだけ**を表示し、レディース／メンズで数値も切り替わる。
※「サイズ登録」機能は実装していない。

**決済** — クレジットカード（Visa / Mastercard / JCB / AMEX / Diners / Discover を判定）／
PayPay ／ コンビニ払い ／ Apple Pay ／ 代金引換。**デモ実装で、カード番号は保存しない**
（保存されるのは「Visa •••• 4242」という表示用ラベルのみ）。

**管理画面（PC）`/admin`**

- ダッシュボード：商品数・利用者数・総スワイプ数・注文数・売上（支払い済みのみ）
- 商品ごとの **いいね率** =（右スワイプ＋いいね！）÷ 全スワイプ、見送られた順に並ぶ
- 未スワイプの商品は 0% ではなく **null**（「データなし」と「ゼロ」を区別）
- 商品の登録・編集、**写真の切り抜き**（フィードと同じ縦3:4、出力 1080×1440 JPEG）
- 権限はページと Server Action の両方で毎回検証。役割はセッションの控えではなく **DBから直接読む**

**全体**

- **匿名のまま全機能利用可**（登録なしでスワイプ→注文まで）
- **登録時に匿名セッションの履歴を引き継ぎ**（`lib/claim.ts`）
- PWA インストール（iOS Safari は `beforeinstallprompt` が無いため手順を案内）
- レビュー投稿（誰でも可・加重平均で即更新・プレーンテキストとして描画）

---

## 9. 現在のデータ規模（デモ）

| 項目 | 数 |
|---|---|
| 商品 | 9点（レディース6・メンズ3） |
| ブランド | 4（MAISON NOIR / ATELIER SUD / CORSO / NORD） |
| カテゴリー | 4（ワンピース・アウター・トップス・ボトムス） |
| 商品写真 | 2枚組（1枚目モデル着用・2枚目単品） |

---

## 10. セキュリティ・堅牢性で意識した点

- パスワードはハッシュ化して保存。`role` 列は `input: false` で**クライアントから絶対に書けない**
- 管理者昇格は CLI（`npm run make-admin`）のみ
- 在庫は WHERE 条件付きの単一 UPDATE で原子的に引き当て、さらに DB 側に `stock >= 0` の CHECK
- レビュー本文はプレーンテキストとして描画（スクリプト挿入経路なし）
- `.npmrc` で `ignore-scripts=true` — 依存パッケージの install script を全面停止し、
  ネイティブビルドが必要なものだけ明示的に実行（サプライチェーン対策）
- middleware の admin チェックは**利便性であって認可ではない**と明記し、本当の検証は
  `requireAdmin()` で毎回行う

---

## 11. 企画書に書いてはいけないこと / Jangan ditulis

| ❌ | 理由 |
|---|---|
| 「サイズ登録」 | 実装していない。あるのはその場で開く早見表 |
| 「使えば使うほど賢くなる」 | 直近5回しか見ない設計と矛盾する |
| 「決済できます」（断定） | デモ実装。実際の決済処理は行わない |
| 「推薦精度が高い」 | 精度評価は行っていない |
| choice overload を「証明されている」 | 再現性に議論がある。「指摘されている」に留める |
