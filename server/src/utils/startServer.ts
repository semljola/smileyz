import dotenv from 'dotenv'
dotenv.config()
import 'express-async-errors'
import { Server, Socket } from 'socket.io'
import { Express } from 'express'
import { networkInterfaces } from 'os'
import { registerSessionHandlers } from '../socket-handlers/sessionHandlers'
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/websocket'
import { Server as HttpServer, createServer as createHttpServer } from 'http'
import { createApp } from './createApp'

type WebSocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export async function startServer(): Promise<{ httpServer: HttpServer; webSocketServer: WebSocketServer }> {
  const app = createApp()
  const server = await startHttpServer(app)
  const wss = await startWebSocketServer(server)
  return { httpServer: server, webSocketServer: wss }
}

async function startHttpServer(app: Express): Promise<HttpServer> {
  const server = createHttpServer(app)
  const localAddr = getLocalIPAdress()
  const port: number = process.env.PORT ? +process.env.PORT : 8999

  await server.listen(port, () => {
    console.log(`Server started on http://${localAddr}:${port}`)
  })

  return server
}

async function startWebSocketServer(server: HttpServer): Promise<WebSocketServer> {
  const clients: Socket[] = []

  const wss = new Server<WebSocketServer>(server, {
    cors: {
      origin: process.env.ORIGIN,
    },
  })

  wss.on('connection', (ws: Socket) => {
    clients.push(ws)
    console.log('Connected:', ws.id.substring(0, 3))
    registerSessionHandlers(wss, ws)

    ws.on('disconnect', () => {
      console.log('Disconnected:', ws.id.substring(0, 3))
      const i = clients.indexOf(ws)
      clients.splice(i, 1)
    })

    ws.onAny((eventName) => {
      console.log('Event:', eventName)
    })
  })

  return wss
}

function getLocalIPAdress(): string | undefined {
  const nets = networkInterfaces()
  let localAddr: string

  try {
    localAddr = nets.en0?.find((net) => net.family === 'IPv4')?.address ?? 'localhost'
    return localAddr
  } catch (error) {
    console.log('Could not get local IP')
  }
}
