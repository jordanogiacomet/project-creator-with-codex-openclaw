.PHONY: install dev test lint clean

install:
	python -m venv .venv
	.venv/bin/pip install -e .

dev:
	.venv/bin/pip install -e ".[dev]"

test:
	.venv/bin/python -m pytest tests -q

test-verbose:
	.venv/bin/python -m pytest tests -v

clean:
	rm -rf __pycache__ .pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -name "*.pyc" -delete
