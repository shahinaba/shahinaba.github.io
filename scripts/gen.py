import json

TOPICS_FILE = "lessons/lessons.json"


def _load_json(filepath):
    with open(filepath, 'r') as file:
        data = json.load(file)
    return data


def _load_topics():
    return _load_json(TOPICS_FILE)


def _print_div():
    print("----------------------")


def _print_topics():
    topics = _load_topics()
    pretty_topics = json.dumps(topics, indent=4)
    print(pretty_topics)

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
            _print_topics()
            
        elif choice == "4":
            break
        else:
            print("Error: Invalid choice!!!")
