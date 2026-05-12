export interface PickerHandle {
  open: () => void
}

export interface PickerItem<T> {
  id: string
  render: (isActive: boolean) => React.ReactNode
  onPick: () => T
}
