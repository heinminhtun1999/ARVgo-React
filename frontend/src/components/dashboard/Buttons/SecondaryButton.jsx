function SecondaryButton({ text, onClick, disabled, className }) {
    return (
        <button className={`bg-stone-500 text-white p-3 rounded hover:bg-gray-300 cursor-pointer ${className}`} onClick={onClick} disabled={disabled}>
            {text}
        </button>
    )
}

export default SecondaryButton;