# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
"""Tiny OpenAI-compatible chat-completions server used by the mcp-ai e2e specs.

    python stub_provider.py <port>

POST /v1/chat/completions answers according to the current mode.
POST /__mode {"mode": "ok"|"error500"|"error401"|"error429", "content": "...", "queue": ["..."]}
sets the mode; ``queue`` is a list of message contents served one per request (then ``content``).
GET /__requests returns the request bodies seen so far; POST /__reset clears them.
Error bodies deliberately contain a marker the API must never echo back.
"""
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

STATE = {'mode': 'ok', 'content': 'Stub comment: consider naming this variable more clearly.', 'queue': [], 'seen': []}
LEAK = 'STUB-LEAK-SECRET-sk-12345'


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, code, payload):
        raw = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _body(self):
        n = int(self.headers.get('Content-Length') or 0)
        return json.loads(self.rfile.read(n) or b'{}')

    def do_GET(self):
        if self.path == '/__requests':
            return self._send(200, STATE['seen'])
        self._send(404, {})

    def do_POST(self):
        body = self._body()
        if self.path == '/__mode':
            STATE['mode'] = body.get('mode', 'ok')
            if 'content' in body:
                STATE['content'] = body['content']
            STATE['queue'] = list(body.get('queue') or [])
            return self._send(200, {'ok': True})
        if self.path == '/__reset':
            STATE['seen'] = []
            return self._send(200, {'ok': True})
        if self.path.endswith('/chat/completions'):
            STATE['seen'].append(body)
            mode = STATE['mode']
            if mode.startswith('error'):
                code = int(mode[5:])
                return self._send(code, {'error': {'message': f'upstream says {LEAK}', 'type': 'stub_error'}})
            content = STATE['queue'].pop(0) if STATE['queue'] else STATE['content']
            return self._send(200, {
                'id': 'stub-1', 'object': 'chat.completion', 'model': body.get('model', 'stub'),
                'choices': [{'index': 0, 'finish_reason': 'stop',
                             'message': {'role': 'assistant', 'content': content}}],
                'usage': {'prompt_tokens': 5, 'completion_tokens': 7, 'total_tokens': 12},
            })
        self._send(404, {})


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), Handler).serve_forever()
