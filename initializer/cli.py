import argparse

from initializer.flow.new_project import run_new_project

def main():
    parser = argparse.ArgumentParser(prog="initializer")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("new")

    args = parser.parse_args()

    if args.command == "new":
        run_new_project()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()