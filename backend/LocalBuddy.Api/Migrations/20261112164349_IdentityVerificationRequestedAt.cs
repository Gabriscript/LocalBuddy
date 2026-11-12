using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocalBuddy.Api.Migrations
{
    /// <inheritdoc />
    public partial class IdentityVerificationRequestedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "IdentityVerificationRequestedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdentityVerificationRequestedAt",
                table: "AspNetUsers");
        }
    }
}
