'use strict';
// 証拠品・調査パート・尋問パートの定義

const EVID = {
  // 第1話
  profile_ichijo: { name: '一条のプロフィール', icon: 'profile', desc: '一条誠、42歳。外資系コンサルティング会社のマネージャー。プロフィールは「独身」。週末は「ほぼ海外出張」とのこと。' },
  tan: { name: '一条の左手', icon: 'hand', desc: 'よく日焼けした左手。手の甲も指もこんがり焼けているのに、{薬指の付け根だけ}が細い帯のように白く残っている。' },
  receipt: { name: '落ちていたレシート', icon: 'receipt', desc: '一条の足元に落ちていた。ファミレス「ガスタ」{越谷店}。日付は{先週の日曜日、12時41分}。ハンバーグセット×2、{お子様ランチ×2}。' },
  call: { name: '着信画面', icon: 'phone', desc: 'デート中、一条のスマホにかかってきた電話。表示されていた名前は{『自宅』}。一条はすぐに切った。' },
  // 第2話
  profile_ninomiya: { name: '二宮のプロフィール', icon: 'profile', desc: '二宮翔太、37歳。表参道の美容室で働く美容師。定休日は火曜日。日曜日はなぜか一切連絡がつかない。' },
  hairtie: { name: 'ピンクのヘアゴム', icon: 'hairtie', desc: '二宮の手首に巻かれていた。子ども向けアニメ『きらりん☆ミミ』の柄。ハートと星の飾りつき。' },
  shopcard: { name: 'ショップカード', icon: 'card', desc: '二宮が働く美容室『LUCE』のカード。「大人のための隠れ家サロン」。※{お子様のご来店はご遠慮いただいております}。' },
  memo_family: { name: '二宮の話（家族）', icon: 'memo', desc: '家族について聞いたときの二宮の言葉。「両親は埼玉です。僕、{一人っ子}なんで、親がさみしがってて」' },
  pass: { name: '年間パスポート', icon: 'pass', desc: '二宮が持っている、この水族館の年パス。「{ファミリー年間パスポート}　登録者3名」と書かれている。' },
  notice: { name: '館内の掲示', icon: 'sign', desc: '年間パスポートの案内。「※ファミリー年間パスポートは、{同居のご家族様に限り}ご利用いただけます」' },
  // 第3話
  profile_miura: { name: '三浦のプロフィール', icon: 'profile', desc: '三浦健吾、39歳。不動産会社の社長。プロフィールは「独身（離婚歴あり）」。息子が一人いて、元妻と暮らしているという。' },
  key: { name: '三浦の鍵', icon: 'key', desc: 'カウンターに置かれていた三浦の鍵。タグには「{ウィークリーマンション} ステイ神田 405」。週単位で借りる短期の部屋だ。' },
  calendar: { name: '予定の通知', icon: 'calendar', desc: '三浦のスマホに表示された通知。「{10/15（水）10時00分　東京家裁　第2回調停}」' },
  saeko_memo: { name: '冴子からのLINE', icon: 'chat', desc: '「家庭裁判所の{夫婦関係調整調停（離婚）}は、{離婚するための話し合い}。調停で離婚が成立するまでは、{法律上はまだ夫婦}よ」' },
  // 第4話
  profile_yotsuya: { name: '四谷のプロフィール', icon: 'profile', desc: '四谷優、40歳。玩具メーカー「トイボックス」の開発エンジニア。デート中に何度も『ミサキ』からの電話で呼び出されている。' },
  meishi: { name: '四谷の名刺', icon: 'meishi', desc: '「{株式会社トイボックス}（TOY BOX）開発部 システム課　四谷優」。裏面には「在庫管理AI{『MISAKI』}運用担当」と書かれている。' },
  pamphlet: { name: 'パパロボのパンフレット', icon: 'pamphlet', desc: '開発中の新商品『パパロボ』。「{モニターテスト実施中！お子さまの感想イラスト募集}」。開発責任者：開発部長　{奥 早苗}。' },
  drawing: { name: '子どもの絵', icon: 'drawing', desc: 'クレヨンで描かれたロボットの絵。折りたたまれていて、{『パパ』『だいすき』}の文字が見える。',
    desc2: 'クレヨンで描かれたロボットの絵。折り目を開くと{『パパロボ だいすき』}。パパロボのモニターテストに参加した子どもの絵だ。' },
  memo_yotsuya: { name: '落ちていたメモ', icon: 'note', desc: '四谷の字。『デートの心得　①手をつなぐのは3回目以降（ネット調べ）　{②家に誘うのはまだ早い！引かれる！}　③40歳、もう失敗できない。気持ちは早めに形に』' },
  box: { name: '紺色の小箱', icon: 'box', desc: '四谷が落とし、慌てて拾った小さな箱。リボンがかかっている。ふたの隅に、小さく{『TOY BOX』}のロゴ。' },
};

const INVEST = {
  ch1: {
    bg: 'french', ch: 'ichijo', hint: '（一条さんの様子を、さりげなく観察してみよう）',
    spots: [
      { id: 'receipt', x: 0, y: 136, w: 28, h: 24, l: 'i1_floor' },
      { id: 'hand', x: 136, y: 122, w: 26, h: 16, l: 'i1_hand' },
      { id: 'watch', x: 74, y: 122, w: 26, h: 16, l: 'i1_watch' },
      { id: 'phone', x: 164, y: 128, w: 32, h: 16, l: 'i1_phone' },
      { id: 'wine', x: 52, y: 108, w: 20, h: 30, l: 'i1_wine' },
      { id: 'plate', x: 100, y: 134, w: 40, h: 14, l: 'i1_plate' },
      { id: 'face', x: 96, y: 28, w: 48, h: 62, l: 'i1_face' },
      { id: 'window', x: 12, y: 14, w: 42, h: 70, l: 'i1_window' },
    ],
    talks: [
      { id: 't_work', t: '仕事について', l: 'i1_work' },
      { id: 't_holiday', t: '週末の過ごし方', l: 'i1_holiday' },
      { id: 't_family', t: '家族について', l: 'i1_family' },
    ],
    need: ['receipt', 'hand', 't_holiday'], done: 'i1_done',
  },
  ch2: {
    bg: 'aquarium', ch: 'ninomiya', hint: '（二宮さんの持ち物や、まわりをよく見てみよう）',
    spots: [
      { id: 'notice', x: 2, y: 37, w: 28, h: 36, l: 'i2_notice' },
      { id: 'wrist', x: 146, y: 132, w: 26, h: 18, l: 'i2_wrist' },
      { id: 'pass', x: 106, y: 110, w: 28, h: 20, l: 'i2_pass' },
      { id: 'face', x: 96, y: 28, w: 48, h: 62, l: 'i2_face' },
      { id: 'tank', x: 29, y: 9, w: 62, h: 100, l: 'i2_tank' },
      { id: 'jelly', x: 160, y: 9, w: 51, h: 100, l: 'i2_jelly' },
    ],
    talks: [
      { id: 't_work', t: 'お店について', l: 'i2_work' },
      { id: 't_family', t: '家族について', l: 'i2_family' },
      { id: 't_sunday', t: '日曜日について', l: 'i2_sunday' },
    ],
    need: ['notice', 'wrist', 'pass', 't_work', 't_family'], done: 'i2_done',
  },
  ch3: {
    bg: 'izakaya', ch: 'miura', hint: '（カウンターの上や、三浦さんの話に注目してみよう）',
    spots: [
      { id: 'key', x: 90, y: 130, w: 28, h: 14, l: 'i3_key' },
      { id: 'mphone', x: 160, y: 126, w: 28, h: 18, l: 'i3_phone' },
      { id: 'kphone', x: 4, y: 134, w: 26, h: 20, l: 'i3_kphone' },
      { id: 'beer', x: 58, y: 102, w: 26, h: 28, l: 'i3_beer' },
      { id: 'plate', x: 102, y: 127, w: 36, h: 10, l: 'i3_plate' },
      { id: 'lantern', x: 14, y: 20, w: 34, h: 44, l: 'i3_lantern' },
      { id: 'menu', x: 176, y: 10, w: 60, h: 40, l: 'i3_menu' },
      { id: 'face', x: 96, y: 28, w: 48, h: 62, l: 'i3_face' },
    ],
    talks: [
      { id: 't_div', t: '離婚について', l: 'i3_divorce' },
      { id: 't_home', t: '住まいについて', l: 'i3_home' },
      { id: 't_work', t: '仕事について', l: 'i3_work' },
    ],
    need: ['key', 'mphone', 'kphone', 't_div'], done: 'i3_done',
  },
  ch4: {
    bg: 'park', ch: 'yotsuya', hint: '（四谷さんの持ち物や、足元を見てみよう。話も聞いてみよう）',
    spots: [
      { id: 'bag', x: 182, y: 100, w: 36, h: 38, l: 'i4_bag' },
      { id: 'memo', x: 20, y: 140, w: 26, h: 18, l: 'i4_memo' },
      { id: 'lunch', x: 30, y: 121, w: 34, h: 18, l: 'i4_sand' },
      { id: 'face', x: 96, y: 28, w: 48, h: 62, l: 'i4_self' },
      { id: 'tree', x: 0, y: 8, w: 40, h: 90, l: 'i4_tree' },
    ],
    talks: [
      { id: 't_work', t: '仕事について', l: 'i4_work' },
      { id: 't_holiday', t: '休日の過ごし方', l: 'i4_holiday' },
      { id: 't_home', t: '家に行ってみたい', l: 'i4_home' },
      { id: 't_family', t: '家族について', l: 'i4_family' },
    ],
    need: ['bag', 'memo', 't_work', 't_home'], done: 'i4_done',
  },
};

// 尋問：st の a が「つきつけると正解になる証拠」
const CROSS = {
  c1a: { name: '一条', who: 'ichijo', title: '先週末のこと', wrong: 'w1', ok: 'c1a_ok', bgm: 'cross', st: [
    { t: '僕は仕事人間でね。休日も、ほとんど仕事なんだ。', p: 'c1a_p0' },
    { t: '先週末も、金曜の夜からシンガポールに出張していた。', p: 'c1a_p1', a: ['receipt'] },
    { t: '日曜の夜まで、現地のクライアントと会議漬けさ。', p: 'c1a_p2', a: ['receipt'] },
    { t: '日本でのんびり過ごす週末なんて、ほとんどないんだよ。', p: 'c1a_p3' },
  ] },
  c1b: { name: '一条', who: 'ichijo', title: '左手の跡', wrong: 'w1', ok: 'c1b_ok', bgm: 'cross', st: [
    { t: 'この白い跡かい？これは{ゴルフグローブ}の跡だよ。', p: 'c1b_p0', a: ['tan'] },
    { t: '出張のない週末は、炎天下でラウンドしてるからね。', p: 'c1b_p1' },
    { t: 'グローブをはめるのは左手。だから、左手だけ焼け方が違うのさ。', p: 'c1b_p2', a: ['tan'] },
    { t: '独身の男が、指輪なんてするわけないだろう？', p: 'c1b_p3' },
  ] },
  c1c: { name: '一条', who: 'ichijo', title: 'さっきの電話', wrong: 'w1', ok: 'c1c_ok', bgm: 'pursuit', st: [
    { t: 'さっきの電話は、{会社}からだ。', p: 'c1c_p0', a: ['call'] },
    { t: '部下がトラブルを起こしたみたいでね。', p: 'c1c_p1' },
    { t: 'あとで折り返すさ。大したことじゃない。', p: 'c1c_p2' },
    { t: '一人暮らしの僕に、家から電話なんて、かかってくるはずがない。', p: 'c1c_p3', a: ['call'] },
  ] },

  c2a: { name: '二宮', who: 'ninomiya', title: 'ピンクのヘアゴム', wrong: 'w2', ok: 'c2a_ok', bgm: 'cross', st: [
    { t: 'このヘアゴムですか？仕事道具ですよ！', p: 'c2a_p0' },
    { t: 'お客さんの髪をまとめるときに使うんです。', p: 'c2a_p1' },
    { t: 'キャラクターものなのは……{お子さんのお客さん}用で！', p: 'c2a_p2', a: ['shopcard'] },
    { t: '美容師なら、誰でも持ってますって。', p: 'c2a_p3' },
  ] },
  c2b: { name: '二宮', who: 'ninomiya', title: '姪っ子', wrong: 'w2', ok: 'c2b_ok', bgm: 'cross', st: [
    { t: '{姉の娘}……姪っ子が、今5歳なんです。', p: 'c2b_p0', a: ['memo_family'] },
    { t: 'これがもう、めちゃくちゃ懐いてくれてて。', p: 'c2b_p1' },
    { t: '休みの日は、よく姪っ子と遊んであげてるんです。', p: 'c2b_p2' },
    { t: 'このヘアゴムも、その子が「おそろい」ってくれて。', p: 'c2b_p3' },
  ] },
  c2c: { name: '二宮', who: 'ninomiya', title: '年間パスポート', wrong: 'w2', ok: 'c2c_ok', bgm: 'pursuit', st: [
    { t: 'この水族館、大好きなんです。だから年パス持ってて。', p: 'c2c_p0' },
    { t: 'ファミリー用の年パスなんですけど、そっちの方がお得なんで！', p: 'c2c_p1', a: ['notice'] },
    { t: '登録してるのは、僕と、いとこと、その娘の3人です。', p: 'c2c_p2', a: ['notice'] },
    { t: 'いとこ家族と、すごく仲いいんで。全然おかしくないですよね？', p: 'c2c_p3' },
  ] },

  c3a: { name: '三浦', who: 'miura', title: '今の暮らし', wrong: 'w3', ok: 'c3a_ok', bgm: 'cross', st: [
    { t: '去年の春に、離婚しました。', p: 'c3a_p0' },
    { t: '元妻とは、円満に別れました。今はもう他人です。', p: 'c3a_p1' },
    { t: '今は、{自分で買ったマンション}で、気ままな一人暮らしですよ。', p: 'c3a_p2', a: ['key'] },
    { t: 'だから、カナエさんに隠すことなんて何もありません。', p: 'c3a_p3' },
  ] },
  c3b: { name: '三浦', who: 'miura', title: '離婚の手続き', wrong: 'w3', ok: 'c3b_ok', bgm: 'cross', st: [
    { t: '家を出たのは、離婚してからです。', p: 'c3b_p0' },
    { t: '財産分与も養育費も、全部話し合いで決めました。', p: 'c3b_p1' },
    { t: '揉めることなんて、何もなかったんです。', p: 'c3b_p2', a: ['calendar'] },
    { t: '{家庭裁判所}なんて、行ったこともありませんよ。', p: 'c3b_p3', a: ['calendar'] },
  ] },
  c3c: { name: '三浦', who: 'miura', title: '調停', wrong: 'w3', ok: 'c3c_ok', bgm: 'pursuit', st: [
    { t: 'あの調停は、{離婚が成立したあと}の話し合いなんです。', p: 'c3c_p0', a: ['saeko_memo'] },
    { t: '息子の養育費とか、面会のルールとかを決める場で。', p: 'c3c_p1' },
    { t: '正式な名前は……{夫婦関係調整調停}、だったかな。', p: 'c3c_p2', a: ['saeko_memo'] },
    { t: '書類上、ちょっと時間がかかってるだけ。離婚は、もう済んでるんです。', p: 'c3c_p3', a: ['saeko_memo'] },
  ] },

  c4a: { name: '冴子', who: 'saeko', title: 'ミサキ', wrong: 'w4', ok: 'c4a_ok', bgm: 'cross', st: [
    { t: '夜中だろうと日曜だろうと、ミサキから電話が来ると、彼は飛んでいく。', p: 'c4a_p0' },
    { t: '本人も言ってたわ。「ミサキが呼んでる」って。', p: 'c4a_p1' },
    { t: '{ミサキは女の名前}。どう考えても、奥さんか愛人よ。', p: 'c4a_p2', a: ['meishi'] },
    { t: '独身の男が、休日に女に呼び出される理由なんてないわ。', p: 'c4a_p3', a: ['meishi'] },
  ] },
  c4b: { name: '冴子', who: 'saeko', title: '奥さん', wrong: 'w4', ok: 'c4b_ok', bgm: 'cross', st: [
    { t: 'さっき彼は電話で言ってたわね。「遅れたら奥さんに怒られる」って。', p: 'c4b_p0' },
    { t: '独身の男が、「奥さん」に怒られる？笑わせないで。', p: 'c4b_p1', a: ['pamphlet'] },
    { t: '思わず口ぐせが出たのよ。家で毎日、{奥さん}に怒られてるんでしょうね。', p: 'c4b_p2', a: ['pamphlet'] },
    { t: 'これは、既婚者の決定的な「自白」よ。', p: 'c4b_p3', a: ['pamphlet'] },
  ] },
  c4c: { name: '冴子', who: 'saeko', title: '子どもの絵', wrong: 'w4', ok: 'c4c_ok', bgm: 'cross', st: [
    { t: 'それに、彼のリュックには子どもの絵が入っていたわ。', p: 'c4c_p0' },
    { t: 'クレヨンで、「パパ　だいすき」。', p: 'c4c_p1' },
    { t: '{自分の子ども}でもなければ、そんな絵を持ち歩くわけないでしょう。', p: 'c4c_p2', a: ['pamphlet'] },
    { t: '描かれていたのはロボット。父親をロボットに見立てた、ほほえましい絵ね。', p: 'c4c_p3', a: ['pamphlet', 'drawing'] },
  ] },
  c4d: { name: '冴子', who: 'saeko', title: '家に呼ばない男', wrong: 'w4', ok: 'c4d_ok', bgm: 'cross', st: [
    { t: '何より決定的なのは、これよ。', p: 'c4d_p0' },
    { t: '4回もデートして、彼は一度もあなたを家に呼ばない。', p: 'c4d_p1' },
    { t: '家に呼べないのは、{妻子がいるから}。それ以外に理由なんてないわ。', p: 'c4d_p2', a: ['memo_yotsuya'] },
    { t: 'さっきだって、家の話をしたら真っ青になってたじゃない。', p: 'c4d_p3', a: ['memo_yotsuya'] },
  ] },
  c4e: { name: '冴子', who: 'saeko', title: '紺色の小箱', wrong: 'w4', ok: 'c4e_ok', bgm: 'pursuit', st: [
    { t: 'あの紺色の小箱。リボンまでかかってた。どう見ても{ジュエリーショップ}の箱よ。', p: 'c4e_p0', a: ['box', 'meishi'] },
    { t: '中身は、間違いなく指輪ね。', p: 'c4e_p1' },
    { t: '付き合ってもいない女に、指輪を贈る男なんていないわ。', p: 'c4e_p2' },
    { t: 'つまりあれは、奥さんへのプレゼント。結婚記念日ってところかしら。', p: 'c4e_p3' },
  ] },
};
