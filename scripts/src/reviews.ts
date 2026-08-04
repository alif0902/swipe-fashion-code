/**
 * Ulasan bawaan — DATA SAJA, tanpa efek samping.
 *
 * Dicocokkan ke produk lewat NAMA, bukan id, karena id di database tidak
 * pernah sama dengan urutan di catalog.ts.
 *
 * Teksnya sengaja menyebut hal yang benar-benar ada pada produknya —
 * bahannya, potongannya, kalimat 着心地 yang sudah ditulis di katalog. Ulasan
 * yang bisa ditukar antar produk tanpa terasa aneh adalah ulasan yang
 * ketahuan dibuat massal.
 *
 * daysAgo dipakai skrip seed untuk menyebar createdAt ke belakang. Tanpa itu
 * semua ulasan bertanggal sama dan urutan「新しい順」jadi tidak berarti.
 */
export type SeedReview = {
  productName: string;
  authorName: string;
  rating: number;
  body: string;
  daysAgo: number;
};

export const reviews: SeedReview[] = [
  // --- ワイドデニムパンツ ---
  {
    productName: "ワイドデニムパンツ",
    authorName: "みなみ",
    rating: 5,
    body: "裾がふわっと遅れてついてくる感じが本当に気持ちいいです。丈は165cmでちょうどくるぶしが隠れるくらい。",
    daysAgo: 6,
  },
  {
    productName: "ワイドデニムパンツ",
    authorName: "K.Tanaka",
    rating: 4,
    body: "生地はしっかりめ。最初は少し硬いですが、二回洗ったら身体になじみました。色落ちは今のところありません。",
    daysAgo: 21,
  },
  {
    productName: "ワイドデニムパンツ",
    authorName: "ゆい",
    rating: 5,
    body: "ウエストが細めなので、いつものサイズで大丈夫でした。トップスを入れてもきれいに落ちます。",
    daysAgo: 44,
  },
  {
    productName: "ワイドデニムパンツ",
    authorName: "haru",
    rating: 3,
    body: "デザインは好きですが、思っていたより重さがあります。夏場は少し暑いかもしれません。",
    daysAgo: 73,
  },
  {
    productName: "ワイドデニムパンツ",
    authorName: "さとみ",
    rating: 5,
    body: "スニーカーでもローファーでも合います。結局これしか履いていません。",
    daysAgo: 96,
  },

  // --- タックワイドチノ ---
  {
    productName: "タックワイドチノ",
    authorName: "R.Okada",
    rating: 5,
    body: "タックのおかげで腰まわりが本当に楽です。一日座って仕事をしても跡がつきません。",
    daysAgo: 9,
  },
  {
    productName: "タックワイドチノ",
    authorName: "しょう",
    rating: 4,
    body: "股下70cmは短いかと思いましたが、くるぶしが見える丈で正解でした。173cmでこの長さです。",
    daysAgo: 28,
  },
  {
    productName: "タックワイドチノ",
    authorName: "T.Mori",
    rating: 5,
    body: "コットンなのに落ち感があって、カジュアルすぎません。ジャケットにも合わせられます。",
    daysAgo: 55,
  },
  {
    productName: "タックワイドチノ",
    authorName: "ken",
    rating: 4,
    body: "色はやや明るめのキャメル。写真の通りでした。シワは付きやすいです。",
    daysAgo: 88,
  },

  // --- ノースリーブミディワンピース ---
  {
    productName: "ノースリーブミディワンピース",
    authorName: "あかり",
    rating: 5,
    body: "身体の線を拾わないのに、だらしなく見えないのがすごい。座っても気になりません。",
    daysAgo: 4,
  },
  {
    productName: "ノースリーブミディワンピース",
    authorName: "M.Ishii",
    rating: 5,
    body: "一枚で完成するので朝が楽です。上にニットを重ねると秋まで着られました。",
    daysAgo: 33,
  },
  {
    productName: "ノースリーブミディワンピース",
    authorName: "のぞみ",
    rating: 4,
    body: "生地に厚みがあって透けません。色は写真より少し暗めの落ち着いた印象です。",
    daysAgo: 61,
  },
  {
    productName: "ノースリーブミディワンピース",
    authorName: "yuka",
    rating: 4,
    body: "158cmで着ると裾がふくらはぎの真ん中あたり。ヒールなしでも重くなりませんでした。",
    daysAgo: 102,
  },

  // --- フラワープリントワンピース ---
  {
    productName: "フラワープリントワンピース",
    authorName: "えみ",
    rating: 5,
    body: "二枚仕立てなので透ける心配がありません。風が通るたびに柄が動いて、写真より素敵でした。",
    daysAgo: 11,
  },
  {
    productName: "フラワープリントワンピース",
    authorName: "A.Kubo",
    rating: 4,
    body: "ティアードですが広がりすぎず上品です。セール価格で買えたので満足しています。",
    daysAgo: 37,
  },
  {
    productName: "フラワープリントワンピース",
    authorName: "ちひろ",
    rating: 5,
    body: "インナーが付いているので一枚で完結します。旅行に持っていってもシワが目立ちませんでした。",
    daysAgo: 70,
  },
  {
    productName: "フラワープリントワンピース",
    authorName: "mao",
    rating: 3,
    body: "柄は好みですが、ポリエステルなので夏は少しこもります。風のある日は快適でした。",
    daysAgo: 94,
  },

  // --- コーラルブルゾン ---
  {
    productName: "コーラルブルゾン",
    authorName: "D.Saito",
    rating: 5,
    body: "羽織った瞬間に肩の力が抜ける厚みです。派手に見える色ですが、着ると意外と落ち着いています。",
    daysAgo: 3,
  },
  {
    productName: "コーラルブルゾン",
    authorName: "たける",
    rating: 4,
    body: "スウェット地なので気楽に着られます。リブがしっかりしていて裾がもたつきません。",
    daysAgo: 26,
  },
  {
    productName: "コーラルブルゾン",
    authorName: "Y.Hara",
    rating: 5,
    body: "春と秋の端境期にちょうどいい厚さ。中に着るものを選ばないのが助かります。",
    daysAgo: 58,
  },

  // --- ヘビーウェイトパーカ ---
  {
    productName: "ヘビーウェイトパーカ",
    authorName: "ryo",
    rating: 5,
    body: "本当にへたりません。半年着てもフードが立ったままです。この厚みでこの価格は驚きました。",
    daysAgo: 8,
  },
  {
    productName: "ヘビーウェイトパーカ",
    authorName: "N.Fujii",
    rating: 5,
    body: "洗うほど身体になじみます。裏起毛ですが真冬以外は一枚でいけました。",
    daysAgo: 30,
  },
  {
    productName: "ヘビーウェイトパーカ",
    authorName: "こうた",
    rating: 4,
    body: "肉厚なぶん乾くのに時間がかかります。それ以外に不満はありません。",
    daysAgo: 64,
  },
  {
    productName: "ヘビーウェイトパーカ",
    authorName: "S.Ueda",
    rating: 5,
    body: "肩まわりに余裕があるので中に厚手を着ても窮屈になりません。",
    daysAgo: 110,
  },

  // --- ネイビーテーラードジャケット ---
  {
    productName: "ネイビーテーラードジャケット",
    authorName: "K.Nishimura",
    rating: 5,
    body: "肩に置くだけで背筋が伸びる、という説明そのままでした。硬すぎず、一日着ても疲れません。",
    daysAgo: 5,
  },
  {
    productName: "ネイビーテーラードジャケット",
    authorName: "まりこ",
    rating: 5,
    body: "ウールのしなやかさが写真では伝わりにくいと思います。実物のほうが柔らかいです。",
    daysAgo: 19,
  },
  {
    productName: "ネイビーテーラードジャケット",
    authorName: "H.Ando",
    rating: 4,
    body: "単品でも十分きれいです。同系色のボトムスと合わせるとセットアップに見えます。",
    daysAgo: 47,
  },

  // --- コットンポロシャツ ---
  {
    productName: "コットンポロシャツ",
    authorName: "あやの",
    rating: 5,
    body: "一日着ても襟が最後まで立っています。鹿の子の目が詰まっていて安っぽくありません。",
    daysAgo: 2,
  },
  {
    productName: "コットンポロシャツ",
    authorName: "J.Kimura",
    rating: 4,
    body: "三色買いました。ピンクがいちばん写真に近いです。ティールは実物のほうが少し落ち着いています。",
    daysAgo: 24,
  },
  {
    productName: "コットンポロシャツ",
    authorName: "riko",
    rating: 5,
    body: "洗濯機で洗っても型崩れしません。夏の定番になりました。",
    daysAgo: 51,
  },
  {
    productName: "コットンポロシャツ",
    authorName: "T.Yoshida",
    rating: 4,
    body: "身幅は少しゆとりがあります。細身が好きな方はワンサイズ下でもいいかもしれません。",
    daysAgo: 79,
  },
  {
    productName: "コットンポロシャツ",
    authorName: "みお",
    rating: 5,
    body: "襟の内側の始末がきれいで、脱いだときにも安っぽく見えません。",
    daysAgo: 105,
  },

  // --- ラグランプリントT ---
  {
    productName: "ラグランプリントT",
    authorName: "しゅん",
    rating: 5,
    body: "腕を上げても肩が突っぱりません。ラグランなので動きやすいです。",
    daysAgo: 7,
  },
  {
    productName: "ラグランプリントT",
    authorName: "E.Matsuda",
    rating: 4,
    body: "プリントは厚盛りでしっかりしています。数回洗いましたがひび割れていません。",
    daysAgo: 35,
  },
  {
    productName: "ラグランプリントT",
    authorName: "なつき",
    rating: 4,
    body: "杢の生地感が写真よりも好みでした。赤の袖が思ったより濃いめです。",
    daysAgo: 68,
  },
];
