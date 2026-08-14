# 企画書の質問に答える / Menjawab pertanyaan 企画書

日本語の設問 → インドネシア語訳 → コードに基づいた回答。
回答の日本語文は、そのまま企画書に貼れる形にしてある。

---

# A. 何を見せるか（1つ選ぶ）
**Apa yang mau ditampilkan (pilih satu)**

| # | 日本語 | Indonesia |
|---|---|---|
| 1 | アプリの使い方の流れ（起動から購入まで） | Alur pemakaian aplikasi (dari buka sampai beli) |
| 2 | 主な機能の一覧 | Daftar fitur utama |
| 3 | 誰のためのアプリか（想定ユーザー） | Untuk siapa aplikasi ini (target pengguna) |
| 4 | 技術的な仕組み（学習・データの流れ） | Mekanisme teknis (pembelajaran & alur data) |

## → **1 を選ぶ**

理由: 企画書の6〜9ページで **2と4はすでに扱っている**。
- P6 スワイプUI ／ P7 学習の仕組み ／ P8 購入まで ／ P9 管理画面

つまり機能も技術も説明済みだが、**「開いてから買うまでが一続きに見える絵」がどこにもない**。
審査員が最も知りたいのは「で、実際どう使うの？」であり、そこが空白のままになっている。

> **補足** — 3（想定ユーザー）は企画書のどこにも書いていない。1ページ割く必要はないが、
> 4ページ目か3ページ目に一行だけ入れておくと、審査員が「誰の問題を解いたのか」を掴める。
>
> Catatan: nomor 3 sama sekali belum ada di seluruh 企画書. Tidak perlu satu halaman
> penuh, tapi satu baris di P3 atau P4 akan membantu juri paham "masalah siapa yang dipecahkan".

---

# B. 内容を具体化する質問

## B-1. 利用者がアプリを開いてから購入するまで、何ステップですか？

> Berapa langkah dari pengguna membuka aplikasi sampai membeli?
> Sebutkan tiap langkah dalam satu kata.

### 回答

**最短は3ステップ。**

```
起動  →  右にスワイプ  →  購入
```

会員登録が要らないため、アプリを開いた瞬間からフィードが始まる。
右にスワイプするとマッチ演出が出て、そのまま購入シートが開く。

**じっくり選ぶ場合は5ステップ。**

```
起動 → スワイプ → 「いいね！」で保存 → 一目惚れで見比べる → 購入
```

| ステップ | 一言 | 画面 |
|---|---|---|
| ① 起動 | 登録不要、すぐフィード | `/feed` |
| ② スワイプ | 右＝欲しい／左＝見送る／いいね！＝保存 | `/feed` |
| ③ 保存 | 迷った一着を貯める | `/obsessed` |
| ④ 比べる | 保存した中から選び直す | `/obsessed` |
| ⑤ 購入 | サイズ・カラー → 決済 | 購入シート → 決済シート |

**Bahasa Indonesia** — Paling pendek 3 langkah: buka → geser kanan → beli. Karena tidak
perlu daftar akun, feed langsung jalan begitu aplikasi dibuka. Kalau mau pikir-pikir dulu,
jadi 5 langkah dengan menyimpan ke 一目惚れ lalu membandingkan.

---

## B-2. スワイプ以外に必ず必要な機能は何ですか？

> Selain swipe, fitur apa yang wajib ada?

### 回答（実装済みのものだけ）

**必須の4つ**

| 機能 | なぜ必須か |
|---|---|
| **一目惚れリスト** | スワイプは速いぶん「今は決められない」が必ず生まれる。受け皿がないと、速さが取りこぼしになる |
| **サイズガイド** | 買わない最大の理由がサイズ。身長・胸囲（ボトムスはウエスト）から S/M/L を引ける表を、サイズを選ぶその場で開く |
| **注文・在庫** | 在庫は注文と同一トランザクションで引き当てる。同時注文でも売り越さない |
| **管理画面（PC）** | スワイプが店側の判断材料になる出口。ここが無いと、集めたデータが利用者側で終わる |

**あると効く3つ**

- **レビュー** — 「評価」をタップして着用コメントが読める。誰でも投稿でき、評価は加重平均で即更新
- **匿名利用＋履歴引き継ぎ** — 登録なしで全機能。登録した時点でそれまでの履歴を移行する
- **PWAインストール** — ホーム画面に追加。Chrome/Androidは1タップ、iOS Safariは手順を案内

> **注意** — 「サイズ登録」は**実装していない**。身体サイズを保存するのではなく、
> その場で引ける早見表を出す方式。企画書で「サイズ登録」と書くと嘘になる。
>
> Perhatian: "registrasi ukuran badan" TIDAK ada. Yang ada adalah tabel rujukan yang
> dibuka saat itu juga. Jangan tulis「サイズ登録」di 企画書 — itu tidak sesuai kode.

---

## B-3. 想定ユーザーは誰ですか？

> Siapa target penggunanya? Umur, jenis kelamin, dan keluhan belanjanya dalam satu kalimat.

### 回答（案 — ここは事実確認が必要な唯一の項目）

**主：18〜29歳、男女問わず**
カタログはレディース・メンズの両方を持っているため、性別は絞らない。

**悩み（一言）**
> 「なんとなく新しい服がほしい」という気持ちはあるのに、それを言葉にできず、
> 検索窓の前で止まってしまう人。

**特に強く当てはまる層**
- 日本のブランドに詳しくない人（留学生、ファッションを始めたばかりの人）
- 通勤・通学の合間など、短時間しか使わない人 ← 直近5回で好みが変わる設計と噛み合う

**Bahasa Indonesia** — Utama: 18–29 tahun, tidak dibatasi gender (katalog punya
レディース dan メンズ). Keluhannya: punya keinginan "pengen baju baru" tapi tidak bisa
menjadikannya kata, sehingga berhenti di depan kotak pencarian. Paling kena: orang yang
tidak hafal brand Jepang, dan orang yang cuma pakai aplikasi sebentar-sebentar.

---

## B-4. 「−1の重み」は具体的に何に反映されますか？

> Bobot −1 itu masuk ke mana persisnya?

### 回答（コードに基づく正確な答え）

−1 は **カテゴリー・ブランド・色の親和度** に加算される。その親和度が、次に出る商品の
**並び順**を決める。

```
左スワイプ  →  そのカテゴリー −1
            →  そのブランド   −1
            →  その色         −1 ÷ 色数
```

親和度は各次元の最大値で正規化され（−1〜+1）、商品の総合スコアは：

```
スコア = 3 × カテゴリー親和度
       + 2 × ブランド親和度
       + 1.5 × 色親和度
       + 1 × 価格帯の近さ
```

**反映されるもの**
- ✅ 次に出る商品の**並び順**（総合スコア順、安定ソート）
- ✅ カテゴリー比率（重み3＝最も強く効く）
- ✅ ブランド、色

**反映されないもの**
- ❌ **価格帯には反映されない。** 価格帯は「好きだった商品」の価格からのみ作る
  （`weight > 0` の条件）。見送った商品の価格は予算を語らない — デザインが理由かも
  しれないからである。

> これは審査で刺さる細部。「なぜ価格だけ除外したのか」に答えられると、
> 設計を考え抜いたことが伝わる。
>
> Detail ini bagus untuk penilaian: bisa menjelaskan kenapa harga sengaja dikecualikan
> menunjukkan desainnya dipikirkan, bukan asal.

---

## B-5. 使い続けるとどう変わると言えますか？

> Kalau dipakai terus, apa yang berubah?

### 回答

**5回スワイプすれば、それで完成する。**

本作品は直近5回のみを見る（`RECENT_WINDOW = 5`）。信頼度は5回で 1.0 に達する
（`CONFIDENCE_FULL_AT = 5`）。つまり：

| 回数 | 状態 |
|---|---|
| 0回 | 全商品が元の順序（並べ替えなし） |
| 1〜4回 | 部分的に反映（信頼度 0.2 〜 0.8） |
| **5回** | **プロフィール完成。信頼度 1.0** |
| 6回目以降 | 最も古い判断が窓から抜け、常に直近5回だけが効く |

**具体例**
> ワンピースを5回続けて右にスワイプすると、ワンピースの親和度が最大（1.0）になり、
> 重み3が掛かって上位に集まる。その直後にパンツを5回選べば、5回でフィードは
> 入れ替わる。

**言い方の注意** — 「1週間使うと精度が上がる」という言い方は**この作品には当てはまらない**。
長く使っても蓄積しない設計だからである。正しい言い方は：

> 蓄積して賢くなるのではなく、**その日の気分にすぐ追従する**。
> 5回、約10秒でフィードが変わる。

**Bahasa Indonesia** — Jangan bilang "makin lama makin akurat" — desainnya justru
sengaja tidak menumpuk. Yang benar: **cukup 5 swipe (~10 detik) feed sudah berubah**,
dan keputusan ke-6 ke belakang sengaja dilupakan supaya perubahan mood langsung terikut.

---

## B-6. 店側の管理画面にはどんな数値が出ますか？

> Angka apa saja yang muncul di panel admin?

### 回答（実装済み）

**商品ごと（`getProductPerformance`）**

| 数値 | 内容 |
|---|---|
| 右スワイプ数 | `likes` |
| 左スワイプ数 | `passes` ← **売上表には絶対に出ない数字** |
| いいね！数 | `supers` |
| 注文数 | `orders` |
| **いいね率** | `(likes + supers) ÷ 全スワイプ` |
| 在庫 | `stock` |

いいね率は、一度もスワイプされていない商品では **null**（0%ではない）。
「0%」と「まだデータがない」は違うため、意図的に区別している。

**全体（`getAdminSummary`）**
商品数 ／ 利用者数 ／ 総スワイプ数 ／ 注文数 ／ 売上（支払い済みのみ）

**設計上の要点**
> 分析専用のテーブルは作っていない。すべて既存の `swipes` テーブルから集計している。
> 一人分の好みを作るために記録していた同じテーブルを、集計して見ると
> **「どの商品が最も見送られたか」**という別の問いに答える。
>
> これが可能なのは、左スワイプを最初から記録していたからである。
> 普通の店は「何が売れたか」しか分からない。この作品は
> **「見られて、そして見送られたもの」**が分かる。

**Bahasa Indonesia** — Tidak ada tabel analitik khusus; semuanya dihitung dari tabel
`swipes` yang sama. Tabel yang tadinya cuma untuk selera satu orang, kalau dilihat secara
agregat menjawab pertanyaan berbeda: produk mana yang paling sering dilewati. Ini cuma
mungkin karena swipe kiri direkam sejak awal.
