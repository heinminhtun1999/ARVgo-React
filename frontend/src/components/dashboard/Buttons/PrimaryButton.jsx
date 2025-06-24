function PrimaryButton({ text, onClick, disabled }) {
    return (
        <button className="bg-primary-green-400 text-white p-3 rounded-lg hover:bg-primary-green-300 cursor-pointer" onClick={onClick} disabled={disabled}>
            {text}
        </button>
    )
}

export default PrimaryButton;