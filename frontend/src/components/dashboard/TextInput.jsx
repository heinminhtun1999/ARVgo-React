function TextInput({ onChange, value, placeholder }) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            className="w-full p-2 border-b border-gray-300  focus:outline-none focus:border-primary-green-400"
            onChange={onChange}
            value={value}
        />
    )
}

export default TextInput