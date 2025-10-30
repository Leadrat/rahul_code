# Game Backend - .NET Core Clean Architecture

A modern .NET Core backend implementation using clean architecture principles, Microsoft Identity, and row-level security for the Tic-Tac-Toe game application.

## Architecture

This project follows Clean Architecture principles with the following layers:

### 1. Domain Layer (`GameBackend.Domain`)
- **Entities**: Core business entities (ApplicationUser, Game, Invite)
- **Interfaces**: Repository contracts and domain services
- No external dependencies

### 2. Application Layer (`GameBackend.Application`)
- **Services**: Business logic services (AuthService, GameService, InviteService)
- **DTOs**: Data transfer objects for API communication
- Depends on Domain layer

### 3. Infrastructure Layer (`GameBackend.Infrastructure`)
- **Data**: Entity Framework DbContext and migrations
- **Repositories**: Concrete implementations of repository interfaces
- External dependencies (EF Core, PostgreSQL)

### 4. API Layer (`GameBackend.API`)
- **Controllers**: REST API endpoints
- **Program.cs**: Application configuration and DI setup
- Depends on Application and Infrastructure layers

## Features

### Authentication & Authorization
- **Microsoft Identity**: ASP.NET Core Identity for user management
- **JWT Tokens**: Secure token-based authentication
- **Row-Level Security**: Database-level security for user data isolation
- **Admin Roles**: Built-in admin functionality

### Database Integration
- **Entity Framework Core**: Modern ORM with LINQ support
- **PostgreSQL/Neon DB**: Cloud-native PostgreSQL database
- **Migrations**: Database schema versioning
- **Connection Resilience**: Automatic retry and failover

### Security Features
- **Password Hashing**: Secure password storage with ASP.NET Identity
- **JWT Validation**: Token-based request authentication
- **CORS Configuration**: Cross-origin request security
- **Row-Level Filtering**: Users can only access their own data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Games
- `GET /api/games` - Get user's games
- `GET /api/games/{id}` - Get specific game
- `POST /api/games` - Create new game
- `PUT /api/games/{id}` - Update game
- `DELETE /api/games/{id}` - Delete game

### Invites
- `GET /api/invites` - Get user's invites
- `GET /api/invites/{id}` - Get specific invite
- `POST /api/invites` - Create invite
- `PUT /api/invites/{id}/status` - Update invite status
- `DELETE /api/invites/{id}` - Delete invite

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- PostgreSQL/Neon DB database
- Visual Studio 2022 or VS Code

### Configuration

1. **Database Connection** (appsettings.json):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "postgresql://username:password@host:port/database?sslmode=require"
  }
}
```

2. **JWT Settings**:
```json
{
  "JwtSettings": {
    "Secret": "your-super-secret-jwt-key-that-is-at-least-256-bits-long",
    "Issuer": "GameBackend",
    "Audience": "GameBackend"
  }
}
```

3. **Admin Email**:
```json
{
  "AdminEmail": "admin@example.com"
}
```

### Running the Application

1. **Clone and Build**:
```bash
cd dotnet_core_backend
dotnet restore
dotnet build
```

2. **Database Migrations**:
```bash
dotnet ef database update
```

3. **Run the API**:
```bash
cd GameBackend.API
dotnet run
```

The API will be available at `http://localhost:5000`

### Development

#### Adding New Entities
1. Create entity in `Domain/Entities/`
2. Add repository interface in `Domain/Interfaces/`
3. Implement repository in `Infrastructure/Repositories/`
4. Add service in `Application/Services/`
5. Create controller in `API/Controllers/`

#### Database Changes
```bash
# Add new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

## Testing

### Unit Tests
```bash
dotnet test
```

### API Testing
Use Swagger UI at `http://localhost:5000/swagger` or Postman collection.

## Deployment

### Docker
```dockerfile
# Build and run with Docker
docker build -t gamebackend .
docker run -p 5000:8080 gamebackend
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing key
- `ADMIN_EMAIL`: Admin user email

## Security Considerations

1. **Row-Level Security**: Database queries are automatically filtered by user ID
2. **JWT Expiration**: Tokens expire after 7 days
3. **Password Requirements**: Minimum 6 characters with digit requirement
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure allowed origins appropriately

## Performance

- **Connection Pooling**: EF Core connection pooling enabled
- **Async/Await**: All database operations are asynchronous
- **Indexing**: Proper database indexes on foreign keys
- **Caching**: Consider Redis for distributed caching

## Monitoring

- **Structured Logging**: Microsoft.Extensions.Logging
- **Health Checks**: Built-in health check endpoints
- **Application Insights**: Azure monitoring integration

## Contributing

1. Follow Clean Architecture principles
2. Write unit tests for new features
3. Update API documentation
4. Follow coding standards and conventions
