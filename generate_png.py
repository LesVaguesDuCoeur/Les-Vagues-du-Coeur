import base64
dummy_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTnU1rJ9AAAADUlEQVQYV2P4//8/AwAI/AL+X9t6WgAAAABJRU5ErkJggg=="
with open("assets/icon-192.png", "wb") as f: f.write(base64.b64decode(dummy_png))
with open("assets/icon-512.png", "wb") as f: f.write(base64.b64decode(dummy_png))
