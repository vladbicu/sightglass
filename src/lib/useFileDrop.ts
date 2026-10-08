import { useRef, useState } from 'react'
import { RECIPE_FILE_ACCEPT } from './parseRecipe'

/**
 * Drag-and-drop plus click-to-pick for recipe files, shared by every drop zone
 * (the viewer's, the tap list's, and both hub cards). Spread `dropProps` on the
 * target, render an `<input {...inputProps} />` anywhere, and call `pick()` on
 * click.
 */
export function useFileDrop(onFiles: (files: File[]) => void, multiple: boolean) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1))
  }

  return {
    dragging,
    pick: () => inputRef.current?.click(),
    dropProps: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
      },
      onDragLeave: () => setDragging(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        take(e.dataTransfer.files)
      },
    },
    inputProps: {
      ref: inputRef,
      type: 'file',
      multiple,
      accept: RECIPE_FILE_ACCEPT,
      className: 'hidden',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        take(e.target.files)
        // Reset so picking the same file twice in a row still fires onChange.
        e.target.value = ''
      },
    },
  }
}
