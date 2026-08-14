# HITOME — 先行研究・市場データ

作品の主張ごとに、裏づけになる研究と、まだ研究が存在しない部分を整理したもの。
2026年8月時点の調査。

**読み方の注意** — ★ は主張を直接支えるもの、☆ は隣接分野からの間接的な支え。
本文まで読めていないものは要旨レベルの記述にとどめてある。企画書に数字を引く
場合は原典を確認すること。

---

## 1. 「スワイプは検索より負担が軽い」

★ **Swiping vs. Scrolling in Mobile Shopping Applications**（HCI International 2016 / Springer）
モバイルショッピングにおける横スワイプと縦スクロールを比較した実験。スワイプ側が
**cognitive absorption（没入）と playfulness（楽しさ）で有意に高い**という結果。さらに
再利用意向とタスク成績を押し上げたのは playfulness ではなく cognitive absorption
のほうだった、と報告している。

→ HITOME の「考える前に判断できる」という設計主張に、いちばん近い実験研究。
　企画書でひとつだけ引くならこれ。

★ **Power of the Swipe: Why Mobile Websites Should Add Horizontal Swiping…**
（International Journal of Human–Computer Interaction, Vol.32 No.4, 2016）
モバイルサイトにタップ・クリック・スクロールへ横スワイプを追加することの効果を扱った論文。

☆ **Swipe vs. scroll: Web page switching on mobile browsers**
タブ切り替えの実験だが、横方向のほうが速く、フラストレーションが低いという結果。

---

## 2. 「選択肢が多いと、かえって買えなくなる」

☆ Choice overload / paradox of choice の一般文献。ファッションECに絞った実証としては
**Exploring Choice Overload, Internet Shopping Anxiety, Variety Seeking and Online
Shopping Adoption**（オンラインファッションストアを対象）が近い。

注意点 — 選択過多そのものは有名な理論だが、**再現性に議論がある**領域でもある
（元のジャム実験はメタ分析で効果が小さいとされた）。企画書では「研究がこう証明した」
ではなく「こう指摘されている」程度の書き方が安全。

---

## 3. 「見送った判断にも情報がある」— ここが最も強い

★ **Benefiting from Negative yet Informative Feedback by Contrasting Opposing
Sequential Patterns**（RecSys 2025 / arXiv:2508.14786）
> 従来の系列推薦モデルは肯定的な相互作用ばかりを予測対象にしており、
> ネガティブフィードバックを減らすことが満足度を上げるという点を無視している。
> さらにネガティブフィードバックは、真のユーザー関心をより正確に特定する
> 有用な信号になりうる。

肯定・否定それぞれの系列に別の Transformer を当て、対比項を含む複合損失で学習。
**true-positive 指標を改善しつつ、誤って推薦される否定アイテムを削減**したと報告。

→ HITOME の「左スワイプに −1 の重みを与える」は、この論文の主張とほぼ同じ方向。
　しかも RecSys 2025 という最新の会議で扱われている＝**まだ実装が追いついていない領域**。
　企画書の 新規性 ページで引くと効く。

★ **Learning and Optimization of Implicit Negative Feedback for Industrial
Short-video Recommender System**（arXiv:2308.13249、Kuaishou）
スキップ等の暗黙的な否定信号を産業規模の推薦システムで扱った事例。

☆ **When Top-ranked Recommendations Fail: Modeling Multi-Granular Negative
Feedback…**（arXiv:2511.18700）多粒度の否定フィードバック。

**この分野の共通認識** — 実サービスでは否定は明示されず、ユーザーは黙って
スキップする。つまり「否定を明示的に取れるUI」自体が希少。スワイプはそれを
自然に取れる数少ない操作、という位置づけができる。

---

## 4. 「直近5回だけを見る」

☆ セッションベース推薦 / concept drift の文献群。
- **Modelling Concept Drift in Dynamic Data Streams for Recommender Systems**
  （ACM Transactions on Recommender Systems, 2025）
- **Recommendation Based on Users' Long-Term and Short-Term Interests with
  Attention**（Mathematical Problems in Engineering, 2019）

要旨レベルの共通見解は「短期と長期の**両方**を組み合わせるのが最良」。
つまり HITOME の「直近5回のみ」は、研究の主流からするとやや極端。

→ 企画書では「精度で勝つ」ではなく **「その場で変化が体感できること」を優先した設計判断**
　として書くほうが誠実で、かつ突っ込まれにくい。審査で「なぜ5回？」と聞かれたときの
　答えも用意しておくとよい（例：スワイプ5回＝約10秒で feed が変わる、という体験の速さ）。

---

## 5. 「見られたのに選ばれなかった商品」— 店側の価値

☆ オペレーションズ・リサーチの **censored demand / unobserved lost sales** 研究群。
- **Stalking Information: Bayesian Inventory Management with Unobserved Lost Sales**
  （Management Science 45(3)）
- **Sales Forecasting for Fashion Products Considering Lost Sales**
- **Demand forecasting under lost sales stock policies**（Int. J. Forecasting, 2023）

共通する前提が、そのまま HITOME の論拠になる：
> 需要が満たされなかった場合、その需要は**観測されないまま消える**。学習は需要では
> なく販売実績に基づかざるをえない。

ファッションは特に在庫が薄く店舗数も多いため、この censored demand 問題が深刻だと
指摘されている。

→ HITOME の「いいね率」は、この**観測できないはずの需要を直接観測している**ことになる。
　既存研究が統計的に推定しようとしてきたものを、UIで取ってしまうという整理ができる。
　これは企画書の中でいちばん学術的に筋の通った主張。

---

## 6. 市場データ（日本）

経済産業省「令和6年度 電子商取引に関する市場調査」（2025年8月26日公表）
- 衣類・服装雑貨等の **BtoC EC市場規模 2兆7,980億円**（前年比 4.74%増）
- **EC化率 23.38%**
- BtoC-EC 全体（物販系）は約26兆円、前年比5.1%成長

→ EC化率が2割強ということは、**まだ8割近くが店舗で買われている**。
　「オンラインでは服が選びにくい」という前提を数字で示せる。

---

## 7. 商業的な先行事例（＝研究ではないが、企画書で触れる価値あり）

| サービス | 内容 | 現状 |
|---|---|---|
| Stylect | 靴に特化した Tinder型UI、独自推薦エンジン。2014年に £290,000 調達 | **閉鎖**（Crunchbase: permanently closed） |
| The Yes | AIパーソナライズのファッションEC | **閉鎖** |
| Mada | 短いクイズ＋左右スワイプ、Urban Outfitters等の商品 | 継続中 |
| Blynk / Nibbly | 同系統のスワイプ型 | — |

業界記事（Digiday）では、一度に1商品だけ見せる方式は通常のEC（1画面に4〜12商品）より
1回の訪問で見る商品数が増える、決済最適化と組み合わせると**モバイル平均の3〜5倍の
コンバージョン**という主張もある。ただしこれは業界誌の記述で、査読論文ではない。

**ここが HITOME の立ち位置** — スワイプ型EC自体は10年以上前からあり、閉鎖したものも多い。
つまり「スワイプで買う」だけでは新しくない。**否定を学習に使うこと**と**同じデータを
店側に返すこと**の2点が、先行事例に無い部分。企画書の新規性ページはその2点に絞るのが正しい。

---

## 8. 研究が見つからなかった＝空白地帯

以下は探した範囲で該当する研究が見当たらなかった。これは弱点ではなく、
**作品の新規性そのもの**として書ける。

1. スワイプ型ECの左スワイプを推薦学習に使った実装・評価
   （ネガティブフィードバック研究は動画・音楽が中心で、アパレルEC＋スワイプUIの組み合わせは未見）
2. 消費者向けスワイプデータを、そのまま**小売の仕入れ判断に還流**させた事例研究
3. 「いいね率」に相当する指標を店舗側KPIとして提示した先行例

---

## 9. 企画書への落とし込み（提案）

| 企画書のページ | 引くもの |
|---|---|
| 作品概要 | METI のEC化率23.38% で「まだ選びにくい」を示す |
| きっかけ | choice overload（断定は避ける） |
| 新規性 ① 否定を学習 | RecSys 2025 / arXiv:2508.14786 |
| 新規性 ② 店側に返す | censored demand の前提＋Stylect等が実現していない点 |
| 機能・特徴 ① UI | Swiping vs. Scrolling（HCI International 2016） |

---

## 出典

- [Benefiting from Negative yet Informative Feedback by Contrasting Opposing Sequential Patterns (RecSys 2025)](https://dl.acm.org/doi/10.1145/3705328.3759333) / [arXiv:2508.14786](https://arxiv.org/abs/2508.14786)
- [Learning and Optimization of Implicit Negative Feedback for Industrial Short-video Recommender System (arXiv:2308.13249)](https://arxiv.org/html/2308.13249)
- [When Top-ranked Recommendations Fail: Modeling Multi-Granular Negative Feedback (arXiv:2511.18700)](https://arxiv.org/html/2511.18700)
- [Swiping vs. Scrolling in Mobile Shopping Applications (Springer)](https://link.springer.com/chapter/10.1007/978-3-319-39396-4_16)
- [Power of the Swipe (Int. J. Human–Computer Interaction 32:4)](https://www.tandfonline.com/doi/abs/10.1080/10447318.2016.1147902)
- [Swipe vs. scroll: Web page switching on mobile browsers](https://www.researchgate.net/publication/266653965_Swipe_vs_scroll_Web_page_switching_on_mobile_browsers)
- [Modelling Concept Drift in Dynamic Data Streams for Recommender Systems (ACM TORS)](https://dl.acm.org/doi/10.1145/3707693)
- [Recommendation Based on Users' Long-Term and Short-Term Interests with Attention](https://onlinelibrary.wiley.com/doi/10.1155/2019/7586589)
- [Stalking Information: Bayesian Inventory Management with Unobserved Lost Sales (Management Science)](https://pubsonline.informs.org/doi/10.1287/mnsc.45.3.346)
- [Sales Forecasting for Fashion Products Considering Lost Sales](https://www.researchgate.net/publication/361992561_Sales_Forecasting_for_Fashion_Products_Considering_Lost_Sales)
- [Demand forecasting under lost sales stock policies (Int. J. Forecasting)](https://www.sciencedirect.com/science/article/abs/pii/S0169207023000961)
- [Exploring Choice Overload, Internet Shopping Anxiety, Variety Seeking and Online Shopping Adoption](https://www.researchgate.net/publication/304070429_Exploring_Choice_Overload_Internet_Shopping_Anxiety_Variety_Seeking_and_Online_Shopping_Adoption_Relationship_Evidence_from_Online_Fashion_Stores)
- [Choice Overload Bias — The Decision Lab](https://thedecisionlab.com/biases/choice-overload-bias)
- [経済産業省 令和6年度 電子商取引に関する市場調査（2025年8月26日公表）](https://www.meti.go.jp/policy/it_policy/statistics/outlook/250826_kohyoshiryo.pdf)
- [2024年のEC市場は26兆円で5.1%成長（経産省調査の解説）](https://www.future-shop.jp/magazine/ec-market-2024)
- [Swipe right to buy: E-commerce apps take design cues from Tinder (Digiday)](https://digiday.com/marketing/swipe-right-buy-e-commerce-apps-take-design-cues-tinder/)
- [Stylect — Crunchbase（permanently closed）](https://www.crunchbase.com/organization/stylect)
- [Shopping app Mada aims to pick up customers left behind when The Yes shut down (Glossy)](https://www.glossy.co/fashion/shopping-app-mada-aims-to-pick-up-customers-left-behind-when-the-yes-shut-down/)
