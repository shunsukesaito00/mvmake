export type ExportNotificationOutcome = 'success' | 'partial' | 'failure'

export type ExportNotificationPayload = {
  title: string
  body: string
}

export function isNotificationApiSupported(): boolean {
  return typeof Notification !== 'undefined'
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationApiSupported()) return 'unsupported'
  return Notification.permission
}

export function formatExportNotification(
  outcome: ExportNotificationOutcome,
  detail?: string,
): ExportNotificationPayload {
  switch (outcome) {
    case 'success':
      return {
        title: 'FABLE: 書き出し完了',
        body: detail?.trim() || 'MP4 の書き出しが完了しました。',
      }
    case 'partial':
      return {
        title: 'FABLE: 一部の章を保存',
        body: detail?.trim() || '成功した章だけの ZIP を保存しました。失敗章があります。',
      }
    case 'failure':
      return {
        title: 'FABLE: 書き出し失敗',
        body: detail?.trim() || '書き出しに失敗しました。アプリで詳細を確認してください。',
      }
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationApiSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function shouldNotifyExportCompletion(options: {
  enabled: boolean
  permission: NotificationPermission | 'unsupported'
  documentHidden?: boolean
}): boolean {
  if (!options.enabled) return false
  if (options.permission !== 'granted') return false
  // フォーカス中はトーストで足りる。非アクティブ時のみ通知する
  if (options.documentHidden === false) return false
  return true
}

/** @returns 通知を出せたとき true */
export function notifyExportCompletion(
  outcome: ExportNotificationOutcome,
  detail?: string,
  options?: { enabled?: boolean; documentHidden?: boolean; iconUrl?: string },
): boolean {
  const enabled = options?.enabled === true
  const permission = getNotificationPermission()
  const documentHidden =
    options?.documentHidden ?? (typeof document !== 'undefined' ? document.hidden : true)

  if (!shouldNotifyExportCompletion({ enabled, permission, documentHidden })) {
    return false
  }

  const payload = formatExportNotification(outcome, detail)
  try {
    const icon = options?.iconUrl
    const notification = new Notification(payload.title, {
      body: payload.body,
      tag: `fable-export-${outcome}`,
      ...(icon ? { icon } : {}),
    })
    void notification
    return true
  } catch {
    return false
  }
}
