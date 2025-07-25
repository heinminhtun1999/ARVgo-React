function PrimaryButton({ text, onClick, disabled, className }) {
    return (
        <button className={`bg-primary-green-400 text-white p-3 rounded hover:bg-primary-green-300 cursor-pointer disabled:bg-amber-600 ${className}`} onClick={onClick} disabled={disabled}>
            {text}
        </button>
    )
}

export default PrimaryButton;