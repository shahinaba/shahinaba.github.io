import pickle  # Import pickle to deserialize the data
import sys

def get_gen_dat_file(lesson_name):
    return f"{lesson_name}/gen.dat"

def get_html_output_file(lesson_name):
    return f"{lesson_name}.html"

# Generate HTML file
def generate_html(phrase_audio_tuple, html_output_file):
    with open(html_output_file, "w", encoding="utf-8") as html_file:
        html_file.write("<html><head><title>Learn French</title></head><body>")
        html_file.write("<table border='1' style='width: 100%; text-align: left;'>")
        html_file.write("<tr><th>English Phrase</th><th>French Phrase</th><th>Play Audio</th></tr>")

        for eng, fr, audio in phrase_audio_tuple:
            html_file.write("<tr>")
            html_file.write(f"<td>{eng}</td>")
            html_file.write(f"<td>{fr}</td>")
            if audio:
                html_file.write(f"<td><audio controls><source src='{audio}' type='audio/mpeg'></audio></td>")
            else:
                html_file.write("<td>Error</td>")
            html_file.write("</tr>")

        html_file.write("</table>")
        html_file.write("</body></html>")


# Generate HTML file
def generate_html(phrase_audio_tuple, html_output_file):
    with open(html_output_file, "w", encoding="utf-8") as html_file:
        html_file.write("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>French Phrases</title>
    <style>
        table {width: 100%; border-collapse: collapse;}
        th, td {border: 1px solid black; padding: 8px; text-align: left;}
        tr:nth-child(even) {background-color: #f2f2f2;}
        tr:nth-child(odd) {background-color: #e6f7ff;}
        th {background-color: #4CAF50; color: white;}
    </style>
    <script>
        function playAudio(audio_file) {
            var audio = new Audio(audio_file);
            audio.play();
        }
    </script>
</head>
<body>
    <h1>French Phrases</h1>
    <table>
        <tr><th>English Phrase</th><th>French Translation</th><th>Listen</th></tr>
""")
        
        for eng, fr, audio in phrase_audio_tuple:
            # Encoding the audio file names for URL compatibility
            audio_file = audio.replace(" ", "%20") if audio else ""
            
            html_file.write("<tr>")
            html_file.write(f"<td>{eng}</td>")
            html_file.write(f"<td>{fr}</td>")
            
            if audio:
                # Add Play button with the correct audio file name
                html_file.write(f"<td><button onclick=\"playAudio('{audio_file}')\">Play</button></td>")
            else:
                html_file.write("<td>Error</td>")
                
            html_file.write("</tr>")

        html_file.write("""
    </table>
</body>
</html>
""")

def load_from_dat_file(gen_dat_file):
    try:
        with open(gen_dat_file, "rb") as f:
            data = pickle.load(f)  # Deserialize the data
        print(f"Data loaded from '{gen_dat_file}'.")
        return data
    except Exception as e:
        print(f"Error loading data: {e}")
        return []

# Main function to generate HTML
def main():
    if len(sys.argv) < 2:
        print("Usage: python gen_html.py <lesson_name>")
        print("Example: python gen_html.py lesson3")
        sys.exit(1)

    # Get the lesson name from the command-line arguments
    lesson_name = sys.argv[1]

    genDatFile = get_gen_dat_file(lesson_name)
    htmlOutputFile = get_html_output_file(lesson_name)

    # Load the data
    phrase_audio_tuple = load_from_dat_file(genDatFile)

    if phrase_audio_tuple:
        # Generate the HTML from the loaded data
        generate_html(phrase_audio_tuple, htmlOutputFile)
        print(f"HTML file '{htmlOutputFile}' has been generated.")
    else:
        print("No data found to generate HTML.")

if __name__ == "__main__":
    main()
