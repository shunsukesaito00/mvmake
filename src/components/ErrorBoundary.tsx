import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearStorage } from '../persistence/db'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('FABLE crashed:', error, info.componentStack)
  }

  private handleClearAndReload = async () => {
    if (!confirm('すべての保存データを削除して初期状態に戻します。よろしいですか？')) return
    try {
      await clearStorage()
    } catch {
      // ストレージ自体が壊れている場合もあるため、失敗しても再読み込みは続行する
    }
    location.reload()
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-surface-0 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-amber-700">
          <span className="text-xl font-black text-surface-0">F</span>
        </div>

        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-text-primary">問題が発生しました</h1>
          <p className="text-sm text-text-secondary">
            アプリケーションでエラーが発生しました。再読み込みで復帰できる場合があります。
            プロジェクトは自動保存されているため、直近の編集内容は保持されています。
          </p>
          <details className="mt-3 rounded-lg bg-surface-2 p-3 text-left ring-1 ring-border">
            <summary className="cursor-pointer text-xs text-text-muted">エラー詳細</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-red-400">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          </details>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => location.reload()}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
          >
            再読み込み
          </button>
          <button
            onClick={this.handleClearAndReload}
            className="rounded-lg bg-red-500/10 px-5 py-2 text-sm text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/20"
          >
            データを削除して初期化
          </button>
        </div>
      </div>
    )
  }
}
