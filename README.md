# Slither.io-Clone-Windsurf-Claude-3.7-Sonnet-withClaudeCodeMCP

## 概要
このプロジェクトは人気ゲーム「Slither.io」のシングルプレイヤー版です。プレイヤーは蛇を操作し、フィールド上の餌を集めながら成長し、NPCの蛇と競争します。ClaudeCodeおよびClaudeCodeMCPのベンチマークを行うために作成しました。

ここから遊べます（https://haruaki-nayuta.github.io/Slither.io-Clone-Windsurf-Claude-3.7-Sonnet-withClaudeCodeMCP/）

（このリポジトリのコードはClaudeCodeMCPを使って作成しました。）

## 特徴
- 完全にフロントエンドのみで実装されたブラウザゲーム
- 3種類のNPC（通常、攻撃的、臆病）が異なる行動パターンで動作
- 3段階の難易度設定（Easy、Normal、Hard）
- リアルタイムリーダーボード
- ミニマップ表示
- ローカルストレージを使用したハイスコア保存

## 操作方法
- マウスで蛇の進行方向を操作
- マウスボタンを押している間は加速（体の一部を消費）
- 他の蛇の体に頭がぶつかるとゲームオーバー
- 他の蛇の頭があなたの体にぶつかると、その蛇が死亡し、多くの餌を放出

## 技術的特徴
- 空間分割法を用いた効率的な衝突検出
- ビューポート最適化による描画パフォーマンスの向上
- 状態マシンを用いたNPCの人工知能
- レスポンシブなキャンバスサイズ

## 実行方法
index.htmlをブラウザで開くだけで実行できます。外部依存はありません。

## 開発者
このゲームはAIアシスタントによって開発されました。
