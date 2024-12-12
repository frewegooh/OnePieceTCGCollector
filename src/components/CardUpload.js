import React from 'react';

const CardUpload = ({ setCards }) => {
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected.");
            return;
        }

        // Ensure the file is of JSON type
        if (file.type !== "application/json") {
            console.error("Please upload a valid JSON file.");
            return;
        }

        // Use FileReader to read the JSON file content
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                setCards(jsonData.results);  // Adjust based on JSON structure
            } catch (error) {
                console.error("Error parsing JSON file:", error);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h2>Upload Card JSON</h2>
            <input
                type="file"
                accept="application/json"
                onChange={handleFileUpload}
            />
        </div>
    );
};

export default CardUpload;
