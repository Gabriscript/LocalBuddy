using Microsoft.AspNetCore.Mvc;

namespace LocalBuddy.Api;

/// Every deliberate failure leaves through here. Before this the API answered with five
/// different error shapes — a bare string, an array of strings, two ad-hoc objects and
/// ProblemDetails — and a client had to understand all five to say what went wrong.
public static class ApiProblem
{
    /// RFC 7807 body plus a stable machine-readable `code` the client can switch on. The
    /// human text in `detail` may be reworded at any time; the code may not.
    public static ObjectResult Failure(this ControllerBase controller, int status, string code, string detail)
    {
        var result = controller.Problem(detail: detail, statusCode: status);
        if (result.Value is ProblemDetails problem) problem.Extensions["code"] = code;
        return result;
    }

    public static ObjectResult Invalid(this ControllerBase c, string code, string detail)
        => c.Failure(StatusCodes.Status400BadRequest, code, detail);

    public static ObjectResult Denied(this ControllerBase c, string code, string detail)
        => c.Failure(StatusCodes.Status403Forbidden, code, detail);

    public static ObjectResult Conflicted(this ControllerBase c, string code, string detail)
        => c.Failure(StatusCodes.Status409Conflict, code, detail);
}
