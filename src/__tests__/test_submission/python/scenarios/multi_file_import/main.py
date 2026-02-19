from helper import parse_and_sum


def main() -> None:
    total = parse_and_sum("3,5,8,13,21")
    assert total == 50
    print(f"[python][multi_file_import] sum={total}")


if __name__ == "__main__":
    main()
