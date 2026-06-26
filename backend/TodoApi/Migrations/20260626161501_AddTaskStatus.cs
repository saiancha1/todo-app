using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsCompleted",
                table: "Tasks",
                newName: "Status");

            // Preserve existing data: the old boolean stored completed = 1, but in the new
            // enum 1 means InProgress and 2 means Done. Remap completed tasks to Done.
            migrationBuilder.Sql("UPDATE \"Tasks\" SET \"Status\" = 2 WHERE \"Status\" = 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Collapse three states back to a boolean: Done -> 1 (completed), everything else -> 0.
            migrationBuilder.Sql("UPDATE \"Tasks\" SET \"Status\" = CASE WHEN \"Status\" = 2 THEN 1 ELSE 0 END;");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Tasks",
                newName: "IsCompleted");
        }
    }
}
