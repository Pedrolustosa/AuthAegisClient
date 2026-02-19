using AuthAegisAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Services from Identity core
builder.Services.AddIdentityApiEndpoints<AppUser>()
                .AddEntityFrameworkStores<AppDbContext>();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.User.RequireUniqueEmail = true;
});

var connectionString = builder.Configuration.GetConnectionString("DevDB");
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(options => 
            options.WithOrigins("http://localhost:4200")
                   .AllowAnyMethod()
                   .AllowAnyHeader());

app.UseAuthorization();

app.MapControllers();

app.MapGroup("/api")
   .MapIdentityApi<AppUser>();

app.MapPost("/api/signup", async (
    UserManager<AppUser> userManager,
    [FromBody] UserRegistrationModel model
    ) =>
    {
        AppUser user = new AppUser
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName
        };
        var result = await userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
            return Results.Ok(result);
        else
            return Results.BadRequest(result);
    }
);

app.Run();

public class UserRegistrationModel
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string FullName { get; set; }
}