from unittest.mock import patch

from initializer.flow.new_project import prompt_choice


def test_prompt_choice_returns_default_on_empty_input():
    with patch("builtins.input", return_value=""):
        result = prompt_choice(
            "Choose deploy target",
            ["docker", "docker_and_k8s_later"],
            "docker",
        )

    assert result == "docker"


def test_prompt_choice_reprompts_until_valid_selection(capsys):
    with patch("builtins.input", side_effect=["abc", "3", "2"]):
        result = prompt_choice(
            "Choose product surface",
            ["internal_admin_only", "admin_plus_public_site"],
            "admin_plus_public_site",
        )

    out = capsys.readouterr().out

    assert result == "admin_plus_public_site"
    assert out.count("Please choose one of the listed options.") == 2
