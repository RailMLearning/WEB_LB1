package ru.itmo.students.api;

import jakarta.annotation.Priority;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;
import java.util.logging.Logger;

@Provider
@Priority(500)
public class RequestLog implements ContainerRequestFilter, ContainerResponseFilter {
    private static final Logger LOG = Logger.getLogger(RequestLog.class.getName());

    public void filter(ContainerRequestContext request) {
        request.setProperty("started", System.nanoTime());
    }

    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        long started =
                request.getProperty("started") instanceof Long value ? value : System.nanoTime();
        String path = request.getUriInfo().getPath().replaceFirst("^/", "");
        LOG.info(
                request.getMethod()
                        + " /api/"
                        + path
                        + " "
                        + response.getStatus()
                        + " "
                        + (System.nanoTime() - started) / 1000000
                        + "ms");
        if (path.startsWith("auth")) response.getHeaders().putSingle("Cache-Control", "no-store");
    }
}
