import React, { useState, useEffect, useRef, createContext } from 'react'
import { Socket, io } from 'socket.io-client'
import { Session, User } from '../@types/types'
import { useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'

interface socketEvent {
  event: string
  params: any
}

const AppContext = createContext<any>(null)
const socket = io(import.meta.env.VITE_SERVER_ADDRESS)
socket.on('error', (e) => {
  console.log(e)
})

export const AppProvider = ({ children }: { children: JSX.Element | undefined }) => {
  const [user, setUser] = useState<User>(obtainUser())
  const userName = useRef<string>('')
  userName.current = user ? user.name : ''
  const [needName, setNeedName] = useState(false)
  const [socketEventAfterName, setSocketEventAfterName] = useState<socketEvent>({ event: '', params: {} })
  const [webSocketState, setWebSocketState] = useState<string>('Loading Websocket...')
  const [session, setSession] = useState<Session>()
  const sessionRef = useRef<Session>()
  sessionRef.current = session
  const [activeSessionId, setActiveSessionId] = useState<string>()
  const navigate = useNavigate()

  function getMyActiveSessions() {
    socket.emit('findMyActiveSessions', { name: userName.current }, (sessionId: string) => {
      setActiveSessionId(sessionId)
    })
  }

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected')
      setWebSocketState('Connected to Websocket')
      if (sessionRef.current) {
        socket.emit('rejoinSession', { name: userName.current, sessionId: sessionRef.current.id })
      }
    })
    socket.on('message', (message) => {
      console.log('Websocket message: ', message)
    })
    socket.on('sessionUpdated', (session) => {
      setSession(session)
    })
    // socket.on('gameStarted', () => {
    //   if (sessionRef.current) {
    //
    //   }
    // })
    socket.on('disconnect', () => {
      setWebSocketState('Disconnected from Websocket')
    })
    socket.on('error', () => {
      console.log('Error')
    })
    // return () => {
    //   socket.disconnect()
    // }
  }, [socket])

  useEffect(() => {
    if (session && session.code && user.name) {
      navigate('/' + session.code)
    }
  }, [session?.code])

  function obtainUser(): User {
    const userJSON = localStorage.getItem('user')
    if (!userJSON) {
      return { name: '', id: uuid() }
    }
    return JSON.parse(userJSON)
  }

  function saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user))
  }

  function joinSession(roomCode: string) {
    if (!user.name) {
      setSocketEventAfterName({ event: 'joinSession', params: { code: roomCode, user } })
      setNeedName(true)
    } else {
      socket.emit('joinSession', { code: roomCode, user }, (session: Session) => {
        setSession(session)
        navigate('/' + session.code)
      })
    }
  }

  function createSession() {
    console.log(user)
    if (!user.name) {
      setSocketEventAfterName({ event: 'createSession', params: { user } })
      setNeedName(true)
    } else {
      socket.emit('createSession', { user }, (session: Session) => {
        console.log(session)
        setSession(session)
        navigate('/' + session.code)
      })
    }
  }

  function handleChangedName() {
    saveUser(user)
    console.log({ ...socketEventAfterName.params, user })
    if (socketEventAfterName.event) {
      socket.emit(socketEventAfterName.event, { ...socketEventAfterName.params, user }, (session: Session) => {
        console.log(session)
        setSession(session)
        setNeedName(false)
        setSocketEventAfterName({ event: '', params: {} })
      })
    } else {
      setNeedName(false)
    }
  }

  const providers = {
    user,
    setUser,
    handleChangedName,
    socket,
    session: sessionRef.current,
    setSession,
    webSocketState,
    needName,
    setNeedName,
    joinSession,
    createSession,
  }

  return <AppContext.Provider value={providers}>{children}</AppContext.Provider>
}

export default AppContext
