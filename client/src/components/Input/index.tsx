import { ApiError } from '../../types/errors'
import styles from './index.module.scss'

interface InputProps {
  className?: string
  children?: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: ApiError
  style?: {}
}

function Input(props: InputProps) {
  return (
    <div className={styles.inputWrapper}>
      <input
        onChange={props.onChange}
        className={`${props.className} ${styles.input}`}
        style={props.style}
        placeholder={props.placeholder}
      >
        {props.children}
      </input>
      {props.error && <div className={styles.error}>{props.error.message}</div>}
    </div>
  )
}

export default Input
