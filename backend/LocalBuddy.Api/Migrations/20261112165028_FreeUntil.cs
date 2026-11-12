using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocalBuddy.Api.Migrations
{
    /// <inheritdoc />
    public partial class FreeUntil : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FreeUntil",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FreeUntil",
                table: "AspNetUsers");
        }
    }
}
