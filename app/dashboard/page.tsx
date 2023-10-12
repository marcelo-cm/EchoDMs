"use client";

import supabase from "@/supabaseClient";
import "@radix-ui/themes/styles.css";
import {
  Text,
  Card,
  Flex,
  Avatar,
  Box,
  Heading,
  TextField,
  IconButton,
  Button,
  Table,
  AlertDialog,
  Dialog,
  Callout,
  DialogDescription,
} from "@radix-ui/themes";
import {
  InfoCircledIcon,
  LockClosedIcon,
  PaperPlaneIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import "../globals.css";
import { Server } from "http";

const Dashboard = () => {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userServers, setUserServers] = useState<String[]>([]);
  const [serverUserMap, setServerUserMap] = useState<{
    [key: string]: string[];
  }>({});
  const [serverInfoDict, setServerInfoDict] = useState<{
    [key: string]: string[];
  }>({ key: ["value"] });
  const [userInfoDict, setUserInfoDict] = useState<{
    [user: string]: {
      name: string;
      echos_sent: number;
      user_oauth: string;
      proxy_password: string;
    };
  }>({
    placeholder: {
      name: "",
      echos_sent: 0,
      user_oauth: "",
      proxy_password: "",
    },
  });
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    password: "",
    name: "",
    user_oauth: "",
  });
  const [editUserForm, setEditUserForm] = useState<any>();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session) {
      console.log(data.session.user.id);
    } else {
      router.push("/");
    }
  }

  useEffect(() => {
    getUserServers();
  }, []);

  useEffect(() => {
    if (allUsers.length > 0) {
      getUserInfo();
    }
  }, [allUsers]);

  useEffect(() => {
    if (userServers.length > 0) {
      getServerUsers();
      getServerInfo();
    }
  }, [userServers]);

  const getUserServers = async () => {
    // This function gets all the servers that the user is a member of by querying the server_users table with the user's id
    // It then sets the userServers state to an array of the server ids

    const { data, error } = await supabase
      .from("server_users")
      .select("server_id")
      .eq("user_id", localStorage.getItem("user"));

    // console.log("getUserServers: ", data, error);

    if (!error) {
      setUserServers(data.map((element) => element.server_id));
    } else {
      console.log(error);
    }
  };

  const getServerInfo = async () => {
    // This function gets the server name for each server that the user is a member of
    // It then sets the serverInfoDict state to a dictionary of server ids and server names

    const { data, error } = await supabase
      .from("servers")
      .select("id, server_name")
      .in("id", userServers);

    // console.log("getServerInfo: ", data, error);

    if (!error) {
      setServerInfoDict((prevState) => {
        return data.reduce(
          (acc, element) => {
            acc[element.id] = element.server_name;
            return acc;
          },
          { ...prevState }
        );
      });
    } else {
      console.log(error);
    }
  };

  const getUserInfo = async () => {
    const { data, error } = await supabase
      .from("server_users")
      .select(
        "user_id, user_name, user_slack_id, echos_sent, user_oauth, proxy_password"
      )
      .in("user_slack_id", allUsers);

    if (!error) {
      setUserInfoDict((prevState) => {
        return data.reduce(
          (acc, element) => {
            acc[element.user_slack_id] = {
              name: element.user_name,
              echos_sent: element.echos_sent,
              user_oauth: element.user_oauth,
              proxy_password: element.proxy_password,
            };
            return acc;
          },
          { ...prevState }
        );
      });
    } else {
      console.log(error.message);
    }
  };

  const getServerUsers = async () => {
    const { data, error } = await supabase
      .from("server_users")
      .select("user_slack_id, server_id")
      .in("server_id", userServers);

    // console.log("getServerUsers: ", data, error);

    if (!error) {
      mapServerUsers(data);
      setAllUsers(Array.from(new Set(data.map((item) => item.user_slack_id))));
    } else {
      console.log(error);
    }
  };

  const mapServerUsers = (
    data: {
      user_slack_id: string;
      server_id: string;
    }[]
  ) => {
    const mapping: { [key: string]: string[] } = data.reduce(
      (
        acc: { [key: string]: string[] },
        record: { server_id: string; user_slack_id: string }
      ) => {
        if (!acc[record.server_id]) {
          acc[record.server_id] = [];
        }
        acc[record.server_id].push(record.user_slack_id);

        return acc;
      },
      {}
    );

    setServerUserMap(mapping);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    }
  };

  const deleteUser = async (server: string, id: string) => {
    const { error } = await supabase
      .from("server_users")
      .delete()
      .eq("user_id", id)
      .eq("server_id", server)
      .single();
    if (!error) {
      setIsDeleteOpen(false);
    }
    if (error) {
      console.log(error.message);
    }
  };

  const addUser = async (server: string) => {
    console.log(server);
    const { email, password, name, user_oauth } = addUserForm;

    if (!email || !password || !name) {
      console.error("Email, password or name missing!");
      return;
    }

    var { data: user, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    // console.log(user);

    let userId: string | null = user?.user?.id || null;

    // If there is an error signing up, grab the user id from the users table with the email
    if (!signUpError) {
      const { data: userData, error: insertUserError } = await supabase
        .from("users")
        .insert([{ email: email, password: password, id: userId, name: name }]);

      if (insertUserError) {
        console.log(
          "Problem inserting user to users table: ",
          insertUserError.message
        );
      }
    } else {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching existing user ID:", error);
        return;
      }

      if (data) {
        userId = data.id;
      }
    }

    if (!userId) {
      console.error("Unable to get or generate user ID");
      return;
    }

    const { data: serverUserData, error: insertServerError } = await supabase
      .from("server_users")
      .insert([
        {
          server_id: server,
          user_id: userId,
          user_name: name,
          user_oauth: user_oauth,
          echo_sent: 0,
        },
      ])
      .select("*");

    if (insertServerError) {
      console.log(
        "Problem inserting user to server_users table: ",
        insertServerError.message
      );
    }

    router.push("/dashboard");
  };

  const editUser = async (slack_id: string) => {
    const { user_name, user_oauth, proxy_password } = editUserForm || {};

    // Create an object to store only the properties that are not undefined.
    const updateData: { [key: string]: any } = {};
    if (user_name !== undefined) updateData.user_name = user_name;
    if (user_oauth !== undefined) updateData.user_oauth = user_oauth;
    if (proxy_password !== undefined)
      updateData.proxy_password = proxy_password;

    // Check if the updateData object is empty. If it's empty, there's nothing to update.
    if (Object.keys(updateData).length === 0) {
      console.log("No data to update.");
      return;
    }

    const { data, error } = await supabase
      .from("server_users")
      .update(updateData)
      .eq("user_slack_id", slack_id);

    if (!error) {
      setIsDeleteOpen(false);
    }
    if (error) {
      console.log(error.message);
    }
  };

  const updateAddUserForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddUserForm((prevState) => {
      return { ...prevState, [e.target.name]: e.target.value };
    });
  };

  const updateEditUserForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUserForm((prevState: any) => {
      return { ...prevState, [e.target.name]: e.target.value };
    });
  };

  useEffect(() => {
    console.log("editUserForm: ", editUserForm);
  }, [editUserForm]);

  return (
    <main className="flex min-h-screen bg-slate-200 flex-col items-center justify-between p-24">
      {/* Founder Contact Card */}
      <Card variant="classic" size="2" style={{ width: 425 }}>
        <Flex justify="between" align="center">
          <Flex gap="4" align="center">
            <Avatar size="4" radius="full" fallback="M" color="indigo" />
            <Box>
              <Text as="div" weight="bold">
                Marcelo Chaman Mallqui
              </Text>
              <Text as="div" color="gray">
                Founder
              </Text>
            </Box>
          </Flex>
          <a href="mailto:marcechaman@gmail.com">
            <Button>
              <Flex direction="row" align="center" gap="2">
                <Text>Contact</Text>
                <PaperPlaneIcon />
              </Flex>
            </Button>
          </a>
        </Flex>
      </Card>
      <Card variant="classic" size="3" className="min-w-[500px] w-1/2">
        <Heading mb="4" size="6">
          Servers & Users
        </Heading>
        <Box mt="2">
          <Flex direction="column" gap="4">
            {Object.keys(serverUserMap)?.map((server, key) => (
              <Heading size="4" key={key}>
                <Flex gap="2" align="center" justify="between">
                  <Flex gap="2" align="center">
                    <Avatar
                      fallback={
                        serverInfoDict[server] ? serverInfoDict[server][0] : ""
                      }
                    />
                    {serverInfoDict[server]}
                  </Flex>
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <Button size="2">
                        Add User
                        <PlusIcon />
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                      <Dialog.Title>Edit profile</Dialog.Title>
                      <DialogDescription mb="2">
                        Add a user to {serverInfoDict[server]}
                      </DialogDescription>
                      <Flex direction="column" gap="3">
                        <label>
                          <Text as="div" size="2" mb="1" weight="bold">
                            Name
                          </Text>
                          <TextField.Input
                            name="name"
                            onChange={(e) => updateAddUserForm(e)}
                            placeholder="Enter your full name"
                          />
                        </label>
                        <label>
                          <Text as="div" size="2" mb="1" weight="bold">
                            Email
                          </Text>
                          <TextField.Input
                            name="email"
                            onChange={(e) => updateAddUserForm(e)}
                            placeholder="Enter your email"
                          />
                        </label>
                        <label>
                          <Text as="div" size="2" mb="1" weight="bold">
                            Password
                          </Text>
                          <TextField.Input
                            name="password"
                            onChange={(e) => updateAddUserForm(e)}
                            placeholder="Enter your email"
                          />
                        </label>
                        <label>
                          <Text as="div" size="2" mb="1" weight="bold">
                            User OAuth Token
                          </Text>
                          <TextField.Input
                            name="user_oauth"
                            onChange={(e) => updateAddUserForm(e)}
                            placeholder="User OAuth Token"
                          />
                        </label>
                      </Flex>
                      <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Dialog.Close>
                          <Button onClick={() => addUser(server)}>
                            Add User
                          </Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  </Dialog.Root>
                </Flex>
                <Table.Root mb="4">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        Echo DMs Sent
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {serverUserMap[server]?.map((user, key) => (
                      <Table.Row key={key}>
                        <Table.RowHeaderCell>
                          <Flex gap="2" align="center">
                            <Avatar
                              size="2"
                              radius="full"
                              fallback={userInfoDict[user]?.name[0]}
                              color="indigo"
                            />
                            {userInfoDict[user]?.name}
                          </Flex>
                        </Table.RowHeaderCell>
                        <Table.Cell>
                          <Flex gap="2" height="100%" align="center">
                            {userInfoDict[user]?.echos_sent}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2" height="100%" align="center">
                            <Dialog.Root
                              onOpenChange={() => setEditUserForm({})}
                            >
                              <Dialog.Trigger>
                                <Button size="2" variant="soft">
                                  Edit User
                                </Button>
                              </Dialog.Trigger>
                              <Dialog.Content style={{ maxWidth: 500 }}>
                                <Dialog.Title>Edit profile</Dialog.Title>
                                <Flex direction="column" gap="3">
                                  <label>
                                    <Text
                                      as="div"
                                      size="2"
                                      mb="1"
                                      weight="bold"
                                    >
                                      Name
                                    </Text>
                                    <TextField.Input
                                      name="user_name"
                                      onChange={(e) => updateEditUserForm(e)}
                                      defaultValue={userInfoDict[user]?.name}
                                      placeholder="Enter your full name"
                                    />
                                  </label>
                                  <label>
                                    <Text
                                      as="div"
                                      size="2"
                                      mb="1"
                                      weight="bold"
                                    >
                                      User OAuth Token
                                    </Text>
                                    <TextField.Input
                                      name="user_oauth"
                                      onChange={(e) => updateEditUserForm(e)}
                                      defaultValue={
                                        userInfoDict[user]?.user_oauth
                                      }
                                      placeholder="Enter your User OAuth Token"
                                    />
                                  </label>
                                  <label>
                                    <Text
                                      as="div"
                                      size="2"
                                      mb="1"
                                      weight="bold"
                                    >
                                      Proxy Password <em>(Optional)</em>
                                    </Text>
                                    <TextField.Input
                                      name="proxy_password"
                                      onChange={(e) => updateEditUserForm(e)}
                                      defaultValue={
                                        userInfoDict[user]?.proxy_password
                                      }
                                      placeholder="Enter your Proxy Password"
                                    />
                                  </label>
                                  <Box>
                                    <Callout.Root>
                                      <Callout.Icon>
                                        <InfoCircledIcon />
                                      </Callout.Icon>
                                      <Callout.Text>
                                        Proxy passwords allow others to send DMs
                                        on your behalf.
                                      </Callout.Text>
                                    </Callout.Root>
                                  </Box>
                                </Flex>
                                <Flex gap="3" mt="4" justify="end">
                                  <Dialog.Close>
                                    <Button variant="soft" color="gray">
                                      Cancel
                                    </Button>
                                  </Dialog.Close>
                                  <Dialog.Close onClick={() => editUser(user)}>
                                    <Button>Save</Button>
                                  </Dialog.Close>
                                </Flex>
                              </Dialog.Content>
                            </Dialog.Root>
                            <AlertDialog.Root>
                              <AlertDialog.Trigger>
                                <Button size="2" color="red">
                                  Delete
                                </Button>
                              </AlertDialog.Trigger>
                              <AlertDialog.Content style={{ maxWidth: 450 }}>
                                <Flex direction="column">
                                  <AlertDialog.Title>
                                    Are you sure?
                                  </AlertDialog.Title>
                                  <AlertDialog.Description size="2">
                                    If you delete this user, they will have to
                                    sign in again to use this app.
                                  </AlertDialog.Description>
                                  <Flex gap="3" mt="4" justify="end">
                                    <AlertDialog.Cancel>
                                      <Button variant="soft" color="gray">
                                        Cancel
                                      </Button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action>
                                      <Button
                                        variant="solid"
                                        color="red"
                                        onClick={() => deleteUser(server, user)}
                                      >
                                        Delete User
                                      </Button>
                                    </AlertDialog.Action>
                                  </Flex>
                                </Flex>
                              </AlertDialog.Content>
                            </AlertDialog.Root>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Heading>
            ))}
          </Flex>
        </Box>
      </Card>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </main>
  );
};

export default Dashboard;
