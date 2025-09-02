set -o errexit
set -o pipefail
set -o nounset

uvicorn app.main:app --host 0.0.0.0 --port $PORT
