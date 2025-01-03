import os
import shutil
from googletrans import Translator
from gtts import gTTS

# Directories and file paths
PHRASES_FILE = "phrases.txt"
AUDIO_DIR = "audio"
OUTPUT_HTML = "learn_french.html"

# Ensure the audio directory exists and is empty
def setup_audio_directory():
    if os.path.exists(AUDIO_DIR):
        shutil.rmtree(AUDIO_DIR)
    os.makedirs(AUDIO_DIR)

# Translate English to French
def translate_to_french(phrases):
    translator = Translator()
    translationPairs = []


    for i, phrase in enumerate(phrases):
        try:
            print(f"Translating({i + 1}/{len(phrases)}): {phrase}")

            translation = translator.translate(phrase, src="en", dest="fr")
            print(f"Result {translation.text}")

            translationPairs.append((phrase, translation.text))
        except Exception as e:
            print(f"Error translating '{phrase}': {e}")
    return translationPairs

# Create French audio files
def create_audio_files(english_french_pairs):
    audio_tuple = []
    for idx, pairs in enumerate(english_french_pairs):
        en_phrase, fr_phrase = pairs
        try:
            print(f"Creating TTS({idx + 1}/{len(english_french_pairs)}): {en_phrase} / {fr_phrase}")
            tts = gTTS(fr_phrase, lang="fr")
            audio_file = os.path.join(AUDIO_DIR, f"phrase_{idx + 1}.mp3")
            tts.save(audio_file)
            audio_tuple.append((en_phrase, fr_phrase, audio_file))
        except Exception as e:
            print(f"Error creating audio for '{en_phrase}/{fr_phrase}': {e}")
    return audio_tuple

# Generate HTML file
def generate_html(phrase_audio_tuple):
    with open(OUTPUT_HTML, "w", encoding="utf-8") as html_file:
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

# Main function
def main():
    # Setup the audio directory
    setup_audio_directory()

    # Read phrases from the file
    if not os.path.exists(PHRASES_FILE):
        print(f"File '{PHRASES_FILE}' not found.")
        return

    with open(PHRASES_FILE, "r", encoding="utf-8") as file:
        english_phrases = [line.strip() for line in file if line.strip()]

    print(english_phrases)

    # Translate to French
    en_fr_pairs = translate_to_french(english_phrases)

    # Create audio files
    phrase_audio_tuple = create_audio_files(en_fr_pairs)

    # Generate HTML
    generate_html(phrase_audio_tuple)

    print(f"Process completed. Check '{OUTPUT_HTML}' for the output.")

if __name__ == "__main__":
    main()
