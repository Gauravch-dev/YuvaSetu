import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
    private static instance: SocketService;
    private io: SocketIOServer | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(httpServer: HttpServer): void {
        console.log('Initializing Socket.IO...');
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: ["http://localhost:5173", "http://localhost:8080", process.env.CLIENT_URL].filter(Boolean) as string[],
                methods: ["GET", "POST", "PATCH"]
            }
        });

        this.io.on('connection', (socket) => {
            // Join a room based on User ID (for targeted notifications)
            socket.on('join_room', (userId: string) => {
                if (userId) {
                    socket.join(userId);
                    console.log(`Socket ${socket.id} joined room: ${userId}`);
                }
            });

            socket.on('disconnect', () => {
                // console.log('Socket disconnected'); 
            });
        });
    }

    public emitToUser(userId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(userId).emit(event, data);
        }
    }
}

export const socketService = SocketService.getInstance();
