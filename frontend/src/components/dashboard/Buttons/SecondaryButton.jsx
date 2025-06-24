function SecondaryButton({ text, onClick, disabled }) {
    return (
        <button className="bg-stone-500 text-white p-3 rounded-lg hover:bg-gray-300 cursor-pointer" onClick={onClick} disabled={disabled}>
            {text}
        </button>
    )
}

export default SecondaryButton;