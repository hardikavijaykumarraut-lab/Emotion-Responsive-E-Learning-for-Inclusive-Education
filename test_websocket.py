import websocket
import json
import time
import threading

def on_message(ws, message):
    print(f"Received message: {message}")

def on_error(ws, error):
    print(f"WebSocket error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("WebSocket connection closed")

def on_open(ws):
    print("WebSocket connection opened")
    
    # Send a test message
    test_message = json.dumps({"test": "message"})
    ws.send(test_message)
    print(f"Sent: {test_message}")

if __name__ == "__main__":
    # WebSocket URL for the emotion detection service
    ws_url = "ws://localhost:8000/ws/emotion-detection"
    
    print(f"Attempting to connect to WebSocket at {ws_url}")
    
    # Enable WebSocket trace for debugging
    websocket.enableTrace(True)
    
    # Create WebSocket connection
    ws = websocket.WebSocketApp(ws_url,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    
    # Run the WebSocket connection in a separate thread
    wst = threading.Thread(target=ws.run_forever)
    wst.daemon = True
    wst.start()
    
    # Wait for a few seconds to test the connection
    time.sleep(5)
    
    # Close the connection
    ws.close()
    print("Test completed")