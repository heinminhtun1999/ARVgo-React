function DatePicker({ value, handleDateChange, className, id, max, min }) {
    return (
        <input type="date" className={`w-full p-2 text-gray-700 border-b border-gray-300 focus:outline-none focus:border-primary-green-400 ${className}`}
            placeholder="Event Date"
            onChange={handleDateChange}
            value={value.split("T")[0]}
            id={id}
            max={max ? max : new Date().toISOString().split("T")[0]}
            min={min}
        />
    )
}

export default DatePicker;