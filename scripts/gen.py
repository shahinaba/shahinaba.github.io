import json
import os
from googletrans import Translator
from gtts import gTTS
import hashlib


LESSONS_DIR = "lessons"
GEN_DIR = "gen"
GEN_AUDIO_DIR = "audio"
GEN_DATA_FILE = "gen_data.json"
LESSONS_FILE = f"{LESSONS_DIR}/lessons.json"
EN_LANG_CODE = "en"

def _load_generated_data(gen_data_file_path):
    if not os.path.exists(gen_data_file_path):
        return {}
    
    return _load_json(gen_data_file_path)

def _save_generated_data(data, gen_data_file_path):
    with open(gen_data_file_path, "w") as file:
        json.dump(data, file, indent=4)


def _load_phrases(phrases_filepath):
    with open(phrases_filepath, "r", encoding="utf-8") as file:
        phrases = [line.strip() for line in file if line.strip()]
        return phrases


def _load_json(filepath):
    with open(filepath, 'r') as file:
        data = json.load(file)
    return data


def _load_topics():
    return _load_json(LESSONS_FILE)


def _print_div():
    print("----------------------")


def _print_lessons():
    lessons = _load_topics()
    prettyLessons = json.dumps(lessons, indent=4)
    print(prettyLessons)

def _get_translation_maps(phrasesMap, lang_code):
    translator = Translator()
    translationMaps = {}

    for phraseId, phrase in phrasesMap.items():
        try:
            print(f"({phraseId + 1}/{len(phrasesMap)}) Translating({lang_code}): {phrase}")

            translation = translator.translate(phrase, src=EN_LANG_CODE, dest=lang_code)
            print(f"\tResult: {translation.text}")

            translationMaps[phraseId] = {EN_LANG_CODE: phrase, lang_code: translation.text}
        except Exception as e:
            print(f"Error translating '{phrase}': {e}")
    return translationMaps



def _get_phrase_hash(phrase):
    return hashlib.md5(phrase.encode()).hexdigest()


def _get_audio_maps(gen_audio_dir, translation_maps, lang_code):
    audioMaps = {}

    for phraseId, translationMap in translation_maps.items():
        print(f"({phraseId + 1}/{len(translation_maps)}) Creating Audio")
        audioMap = {}
        for lang_code in translationMap:
            phrase = translationMap[lang_code]
            print(f"  ({lang_code}): {phrase}")
            try:
              tts = gTTS(phrase, lang=lang_code)
              phraseHash = _get_phrase_hash(phrase)
              audio_file = os.path.join(gen_audio_dir, f"{phraseHash}.mp3")
              tts.save(audio_file)
              audioMap[lang_code] = audio_file
            except Exception as e:
              print(f"Error creating audio for '{phrase}': {e}")
          
        if len(audioMap) == 2:
            audioMaps[phraseId] = audioMap
        
    return audioMaps


def _ensure_dir(dir_path):
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def _get_base_name(full_file_name):
    return os.path.splitext(os.path.basename(full_file_name))[0]

def _generate_topic(lang_folder, phrases_file_name, lang_code):
    genDir = f"{LESSONS_DIR}/{GEN_DIR}"
    _ensure_dir(genDir)
    genDataFilePath = f"{genDir}/{GEN_DATA_FILE}"
    lessonsGenData = _load_generated_data(genDataFilePath)

    topicPath = _get_base_name(phrases_file_name)
    genLangData = lessonsGenData.get(lang_folder, {})
    genTopicPhrases = genLangData.get(topicPath, [])
    alreadyGenTopicPhrases = set(phrase["phrase"][EN_LANG_CODE] for phrase in genTopicPhrases)
    print("***", genLangData, genTopicPhrases, alreadyGenTopicPhrases)

    phrases = _load_phrases(f"{LESSONS_DIR}/{lang_folder}/{phrases_file_name}")
    newPhrases = {phraseId: phrase for phraseId, phrase in enumerate(phrases) if phrase not in alreadyGenTopicPhrases}
    print("==========AHHH", len(newPhrases), len(phrases), len(alreadyGenTopicPhrases))
    translationMaps = _get_translation_maps(newPhrases, lang_code)

    genAudioDir = f"{genDir}/{lang_folder}/{topicPath}/{GEN_AUDIO_DIR}"
    _ensure_dir(genAudioDir)
    audioMaps = _get_audio_maps(genAudioDir, translationMaps, lang_code)
    
    for phraseId, audioMap in audioMaps.items():
        if lang_folder not in lessonsGenData:
            lessonsGenData[lang_folder] = {}
        
        if topicPath not in lessonsGenData[lang_folder]:
            lessonsGenData[lang_folder][topicPath] = []

        lessonsGenData[lang_folder][topicPath].append({
            "phrase": translationMaps[phraseId],
            "audio": audioMap
        })

    print(lessonsGenData)

    _save_generated_data(lessonsGenData, genDataFilePath)

def _generate_lesson_content():
    lessons = _load_topics()
    numLessons = len(lessons)
    for lid, language in enumerate(lessons):
        _print_div()
        lessonNum = lid + 1
        langName = language['name']
        langCode = language['language_code']
        langFolder = language["folder"]
        topics = language['topics']
        numTopics = len(topics)
        print(f"({lessonNum}/{numLessons}) {langName}...")
        print(f"Language Code: {langCode}")
        print(f"Folder: {langFolder}")
        print("Topics:")

        for tidx, topic in enumerate(topics):
            topicNum = tidx + 1
            topicName = topic['name']
            phrasesFileName = topic['phrases_file']

            print(f"({topicNum}/{numTopics}) Generating content for {topicName} in {langFolder}/{phrasesFileName}...")
            _generate_topic(langFolder, phrasesFileName, langCode)
            
            


def _update_website():
    pass


if __name__ == '__main__':
    while True:
        _print_div()
        print("1. Show Lessons")
        print("2. Generate Lesson Content")
        print("3. Update Website")
        print("4. Exit")
        _print_div()
        choice = input("Enter choice: ")
        _print_div()

        if choice == "1":
            _print_lessons()
        elif choice == "2":
            _generate_lesson_content()
        elif choice == "3":
            _update_website()
        elif choice == "4":
            break
        else:
            print("Error: Invalid choice!!!")
