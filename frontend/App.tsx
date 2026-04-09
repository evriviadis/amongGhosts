import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Client, Room } from 'colyseus.js';

// Replace with your computer's local Wi-Fi IP address (e.g., '192.168.1.5')
const LOCAL_IP = '192.168.68.61'; 
const client = new Client(`ws://${LOCAL_IP}:2567`);

export default function App() {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  // Listen to Colyseus state for players
  useEffect(() => {
    if (!connectedRoom) return;

    // Reset players array on new connection
    setPlayers([]);

    const onAdd = (player: any, sessionId: string) => {
      setPlayers(prev => [...prev, { sessionId, ...player }]);
      
      // Update logic if a player's internals change (e.g. gets promoted, name changes etc)
      player.onChange(() => {
        setPlayers(prev => prev.map(p => p.sessionId === sessionId ? { sessionId, ...player } : p));
      });
    };

    const onRemove = (player: any, sessionId: string) => {
      setPlayers(prev => prev.filter(p => p.sessionId !== sessionId));
    };

    // Colyseus bindings
    connectedRoom.state.players.onAdd(onAdd);
    connectedRoom.state.players.onRemove(onRemove);

    return () => {
      // Memory cleanup for unmount isn't strictly necessary for schema listeners
      // since leaving the room destroys the state, but we ensure cleanliness by resetting
      setPlayers([]);
    };
  }, [connectedRoom]);

  const handleCreateLobby = async () => {
    if (!username.trim()) {
      setErrorMessage("Please enter a username first.");
      return;
    }
    
    setErrorMessage('');
    setIsConnecting(true);
    
    try {
      const room = await client.joinOrCreate("ghost_lobby", { username });
      setConnectedRoom(room);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to create lobby.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!username.trim()) {
      setErrorMessage("Please enter a username first.");
      return;
    }
    if (!roomCode.trim()) {
      setErrorMessage("Please enter a valid room code.");
      return;
    }

    setErrorMessage('');
    setIsConnecting(true);

    try {
      const room = await client.joinById(roomCode, { username });
      setConnectedRoom(room);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to join lobby. Check your Room Code.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveLobby = () => {
    if (connectedRoom) {
      connectedRoom.leave();
      setConnectedRoom(null);
    }
  };

  // If connected, show the Sub-Lobby Screen
  if (connectedRoom) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>LOBBY</Text>
          <Text style={styles.successSubtitle}>
            Code: <Text style={styles.accentText}>{connectedRoom.id}</Text>
          </Text>
          
          <View style={styles.playersListContainer}>
            <Text style={styles.listHeader}>PLAYERS IN LOBBY ({players.length}/15)</Text>
            <ScrollView style={styles.playersScroll} showsVerticalScrollIndicator={false}>
              {players.map(p => (
                <View key={p.sessionId} style={styles.playerRow}>
                  <Text style={styles.playerName}>
                    {p.username} {p.sessionId === connectedRoom.sessionId && <Text style={styles.youIndicator}>(You)</Text>}
                  </Text>
                  {p.isHost && <Text style={styles.hostBadge}>⭐ HOST</Text>}
                </View>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.leaveButton]} 
            onPress={handleLeaveLobby}
            activeOpacity={0.7}
          >
            <Text style={styles.leaveButtonText}>Leave Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Otherwise, render the Main Connection Menu
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        
        {/* Title Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>👻 Among</Text>
          <Text style={[styles.title, styles.titleAccent]}>Ghosts</Text>
          <Text style={styles.subtitle}>Enter the paranormal zone...</Text>
        </View>

        {/* Dynamic Error Display */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Create Lobby Section */}
        <View style={styles.card}>
          <Text style={styles.label}>PLAYER IDENTITY</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            maxLength={15}
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, isConnecting && styles.buttonDisabled]} 
            onPress={handleCreateLobby}
            disabled={isConnecting}
            activeOpacity={0.8}
          >
             {isConnecting ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text style={styles.primaryButtonText}>Create New Lobby</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join Existing Lobby Section */}
        <View style={styles.card}>
           <Text style={styles.label}>JOIN EXISTING GAME</Text>
           <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Room Code"
                placeholderTextColor="#666"
                value={roomCode}
                onChangeText={setRoomCode}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, isConnecting && styles.buttonDisabled]} 
                onPress={handleJoinLobby}
                disabled={isConnecting}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Join</Text>
                )}
              </TouchableOpacity>
           </View>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Deep dark gray/black required by specs
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  titleAccent: {
    color: '#00ff9d', // Ghostly Neon Green
    textShadowColor: 'rgba(0, 255, 157, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginTop: -5,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  label: {
    color: '#00ff9d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    color: '#fff',
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
  },
  button: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButton: {
    backgroundColor: '#00ff9d', 
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: '#b24bf3', // Neon Purple Accent
    paddingHorizontal: 28,
    shadowColor: '#b24bf3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#555',
    paddingHorizontal: 16,
    fontWeight: '800',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Lobby Connected View Styles
  successCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff9d',
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 24,
  },
  accentText: {
    color: '#b24bf3',
    fontWeight: '800',
  },
  playersListContainer: {
    width: '100%',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    height: 250, 
    borderWidth: 1,
    borderColor: '#333'
  },
  listHeader: {
    color: '#b24bf3',
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 1,
    fontSize: 12,
  },
  playersScroll: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  youIndicator: {
    color: '#888',
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  hostBadge: {
    color: '#00ff9d',
    fontWeight: '900',
    fontSize: 12,
  },
  leaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff4444',
    width: '100%',
  },
  leaveButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '800',
  }
});
