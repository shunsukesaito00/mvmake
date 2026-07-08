# v1.1.1

GitHub Pages デプロイの安定性を改善したメンテナンスリリースです。

デモ: https://shunsukesaito00.github.io/mvmake/

## 修正

- **Pages デプロイの連鎖失敗を解消**: `concurrency.cancel-in-progress` を `false` に変更。push 連続時に deploy ジョブが途中キャンセルされ、Pages 側だけ「進行中」デプロイが残って後続が 400 で拒否されていた問題を修正
- **滞留デプロイの自動回復**: deploy 前に `in_progress` / `queued` の Pages デプロイのみキャンセルし、解消を最大 2 分待機するステップを追加
- **無効な timeout 指定を削除**: `deploy-pages` の上限は 10 分のため、それ以上の timeout 指定は無視されていた

## 運用上の注意

- main への **連続 push は避け**、1 回の push ごとに Deploy ワークフローの完了（build → deploy → smoke）を待ってから次を push してください
