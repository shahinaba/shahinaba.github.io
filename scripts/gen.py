import json

LESSONS_FILE = "lessons/lessons.json"


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


def _generate_lesson_content():
    lessons = _load_topics()
    for lid, language in enumerate(lessons):
        _print_div()
        name = language['name']
        languageCode = language['language_code']
        folder = language["folder"]
        topics = language['topics']
        print(f"({lid+1}/{len(lessons)}) {name}...")
        print(f"    Language Code: {languageCode}")
        print(f"    Folder: {folder}")
        print("    Topics:")
        for tidx, topic in enumerate(topics):
            topicName = topic['name']
            phrasesFile = topic['phrases_file']
            fullPhrasesFile = f"{folder}/{phrasesFile}"
            print(f"\t({tidx+1}/{len(topics)}) Generating content for {topicName} in {fullPhrasesFile}...")
            
            


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
