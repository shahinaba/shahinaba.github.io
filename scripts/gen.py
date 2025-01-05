import json

LESSONS_DIR = "lessons"
LESSONS_FILE = f"{LESSONS_DIR}/lessons.json"


def _load_phrases(phrases_filepath):
    fullPath = f"{LESSONS_DIR}/{phrases_filepath}"
    with open(fullPath, "r", encoding="utf-8") as file:
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


def _generate_topic(language_folder, phrases_file):
    phrases = _load_phrases(f"{language_folder}/{phrases_file}")

    print(phrases)


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
            phrasesFile = topic['phrases_file']
            fullPhrasesFile = f"{langFolder}/{phrasesFile}"
            print(f"({topicNum}/{numTopics}) Generating content for {topicName} in {fullPhrasesFile}...")
            _generate_topic(langFolder, phrasesFile)
            
            


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
