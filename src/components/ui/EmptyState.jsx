import Button from './Button'

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="h-14 w-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4">
          <Icon size={26} />
        </div>
      )}
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-light dark:text-muted-dark max-w-sm mb-5">{description}</p>}
      {actionLabel && (
        <Button onClick={onAction} size="sm">{actionLabel}</Button>
      )}
    </div>
  )
}
