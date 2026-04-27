package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Item represents a stored key-value pair.
type Item struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"createdAt"`
}

// Store is a thread-safe in-memory key-value store.
type Store struct {
	mu    sync.RWMutex
	items map[string]Item
}

func NewStore() *Store {
	return &Store{items: make(map[string]Item)}
}

func (s *Store) Get(key string) (Item, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	item, ok := s.items[key]
	return item, ok
}

func (s *Store) Set(key, value string) Item {
	s.mu.Lock()
	defer s.mu.Unlock()
	item := Item{Key: key, Value: value, CreatedAt: time.Now()}
	s.items[key] = item
	return item
}

func (s *Store) List() []Item {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Item, 0, len(s.items))
	for _, item := range s.items {
		result = append(result, item)
	}
	return result
}

var store = NewStore()

func handleGet(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	item, ok := store.Get(key)
	if !ok {
		http.Error(w, fmt.Sprintf("key %q not found", key), http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(item)
}

func handleSet(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	item := store.Set(req.Key, req.Value)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func handleList(w http.ResponseWriter, _ *http.Request) {
	json.NewEncoder(w).Encode(store.List())
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /items", handleList)
	mux.HandleFunc("GET /items/{key}", handleGet)
	mux.HandleFunc("POST /items", handleSet)

	addr := ":8080"
	log.Printf("Listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
