from flask import Flask, jsonify, render_template, request, session
from google import genai
import os



app = Flask(__name__)

# Flask sessions need a secret key. In production, set this with an
# environment variable instead of hard-coding it in the source code.
app.secret_key = "career-saga-ai-demo-secret-key"
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
print("API KEY FOUND:", bool(os.getenv("GEMINI_API_KEY")))

def get_history():
    """Return the current chat history stored in the user's session."""
    if "history" not in session:
        session["history"] = []
    return session["history"]

def build_ai_response(message):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
            You are CareerSaga AI.

            Help students with:
            - Career guidance
            - Programming
            - Data Science
            - AI/ML
            - Software Engineering
            - Resume building
            - Interview preparation

            User question:
            {message}
            """
        )

        return response.text
    except Exception as e:
        if "429" in str(e):
            return "⚠️ Daily Gemini API limit reached. Please try again later."
        return f"Error: {str(e)}"


@app.route("/")
def index():
    """Render the main chat page."""
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    """Accept a user message, save it in session history, and return a reply."""
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    history = get_history()
    history.append({"role": "user", "content": user_message})
    history = history[-8:]

    ai_message = build_ai_response(user_message)
    history.append({"role": "ai", "content": ai_message})
    history = history[-8:]

    # Mark the session as modified because we changed a nested list.
    session["history"] = history

    return jsonify({"response": ai_message, "history": history})


@app.route("/history", methods=["GET"])
def history():
    """Return the current server-side conversation history."""
    return jsonify({"history": get_history()})


@app.route("/clear", methods=["POST"])
def clear_history():
    """Clear server-side conversation history for the current session."""
    session["history"] = []
    return jsonify({"message": "Conversation history cleared."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

