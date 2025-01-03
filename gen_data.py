import os
import shutil
import pickle
from googletrans import Translator
from gtts import gTTS
import sys

def get_phrases_file(lesson_name):
    return f"{lesson_name}/phrases.txt"

def get_gen_dat_file(lesson_name):
    return f"{lesson_name}/gen.dat"

def get_audio_dir(lesson_name):
    return f"{lesson_name}/audio"

# Ensure the audio directory exists and is empty
def setup_audio_directory(audio_dir):
    if not audio_dir:
        print(f"Audio dir {audio_dir} error")
        return

    if os.path.exists(audio_dir):
        shutil.rmtree(audio_dir)
    os.makedirs(audio_dir)

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
def create_audio_files(english_french_pairs, audio_dir):
    audio_tuple = []
    for idx, pairs in enumerate(english_french_pairs):
        en_phrase, fr_phrase = pairs
        try:
            print(f"Creating TTS({idx + 1}/{len(english_french_pairs)}): {en_phrase} / {fr_phrase}")
            tts = gTTS(fr_phrase, lang="fr")
            audio_file = os.path.join(audio_dir, f"phrase_{idx + 1}.mp3")
            tts.save(audio_file)
            audio_tuple.append((en_phrase, fr_phrase, audio_file))
        except Exception as e:
            print(f"Error creating audio for '{en_phrase}/{fr_phrase}': {e}")
    return audio_tuple

def save_to_dat_file(data, gen_data_file):
    with open(gen_data_file, "wb") as f:
        pickle.dump(data, f)  # Serialize the data to the file
    print(f"Data saved to '{gen_data_file}'.")

# Main function
def main():
    if len(sys.argv) < 2:
        print("Usage: python gen_data.py <lesson_name>")
        print("Example: python gen_data.py lesson3")
        sys.exit(1)

    # Get the lesson name from the command-line arguments
    lesson_name = sys.argv[1]

    phrasesFile = get_phrases_file(lesson_name)
    audioDir = get_audio_dir(lesson_name)
    genDatFile = get_gen_dat_file(lesson_name)

    # Setup the audio directory
    setup_audio_directory(audioDir)

    # Read phrases from the file
    if not os.path.exists(phrasesFile):
        print(f"File '{phrasesFile}' not found.")
        return

    with open(phrasesFile, "r", encoding="utf-8") as file:
        english_phrases = [line.strip() for line in file if line.strip()]

    print(english_phrases)

    # Translate to French
    en_fr_pairs = translate_to_french(english_phrases)

    # Create audio files
    phrase_audio_tuple = create_audio_files(en_fr_pairs, audioDir)

    # Save the data to a .dat file
    save_to_dat_file(phrase_audio_tuple, genDatFile)

    print(f"Process completed. Check '{genDatFile}' for the saved data.")


if __name__ == "__main__":
    main()
