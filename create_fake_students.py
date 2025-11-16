from typing import Literal
from random import shuffle, randint
from pyhive import HiveClient
from pyhive.src.types.enums.gender_enum import GenderEnum
from dataclasses import dataclass


@dataclass
class UserData:
    first_name: str
    last_name: str
    gender: GenderEnum


MOCK_STUDENTS: list[UserData] = [
    UserData(first_name="Alice", last_name="Rosen", gender=GenderEnum.FEMALE),
    UserData(first_name="Ben", last_name="Katz", gender=GenderEnum.MALE),
    UserData(first_name="Clara", last_name="Weiss", gender=GenderEnum.FEMALE),
    UserData(first_name="Daniel", last_name="Levi", gender=GenderEnum.MALE),
    UserData(first_name="Ella", last_name="Cohen", gender=GenderEnum.FEMALE),
    UserData(first_name="Felix", last_name="Goldman", gender=GenderEnum.MALE),
    UserData(first_name="Gila", last_name="Shapiro", gender=GenderEnum.FEMALE),
    UserData(first_name="Harel", last_name="Bar-On", gender=GenderEnum.MALE),
    UserData(first_name="Inbar", last_name="Mizrahi", gender=GenderEnum.FEMALE),
    UserData(first_name="Jonah", last_name="Peretz", gender=GenderEnum.MALE),
]


def main():

    with HiveClient(
        "michaelks", "Password1", "https://hive.org/", verify=False
    ) as client:
        mentor = client.get_user_by_name("michaelks")
        assert mentor is not None
        classes = list(client.get_classes())
        programs = list(client.get_programs())

        for number, student_data in enumerate(MOCK_STUDENTS, start=4):
            shuffle(classes)
            shuffle(programs)

            class_count = randint(0, len(classes))
            try:
                client.create_student(
                    f"a-hanich-{number}",
                    "test",
                    gender=student_data.gender,
                    number=number,
                    first_name=student_data.first_name,
                    last_name=student_data.last_name,
                    classes=classes[0:class_count],
                    program=programs[0],
                )
            except Exception as ex:
                print(ex)


if __name__ == "__main__":
    main()
