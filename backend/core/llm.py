from langchain_core.language_models.chat_models import BaseChatModel
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from core.config import settings


def build_chat_model(temperature: float, num_predict: int) -> BaseChatModel:
    if settings.LLM_PROVIDER == "openai":
        return ChatOpenAI(
            api_key=SecretStr(settings.OPENAI_API_KEY),
            base_url=settings.OPENAI_BASE_URL,
            model=settings.OPENAI_MODEL,
            temperature=temperature,
        )

    elif settings.LLM_PROVIDER == "ollama":
        return ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            reasoning=False,
            keep_alive=settings.OLLAMA_KEEP_ALIVE,
            num_ctx=settings.OLLAMA_NUM_CTX,
            temperature=temperature,
            num_predict=num_predict,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")


classifier_llm = build_chat_model(temperature=0, num_predict=60)
answer_llm = build_chat_model(temperature=0.3, num_predict=220)
