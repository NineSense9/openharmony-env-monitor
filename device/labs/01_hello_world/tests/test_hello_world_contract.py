from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
SOURCE = LAB_ROOT / "src" / "hello_world.c"


def test_hello_world_source_defines_two_periodic_tasks():
    source = SOURCE.read_text(encoding="utf-8")

    assert "void task_helloworld" in source
    assert "void task_openharmony" in source
    assert "LOS_Msleep(1000)" in source
    assert "LOS_Msleep(2000)" in source
    assert "Hello World" in source
    assert "Hello OpenHarmony" in source
