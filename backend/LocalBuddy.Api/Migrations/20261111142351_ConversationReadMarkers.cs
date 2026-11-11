using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocalBuddy.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConversationReadMarkers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UserAReadAt",
                table: "Conversations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UserBReadAt",
                table: "Conversations",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserAReadAt",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "UserBReadAt",
                table: "Conversations");
        }
    }
}
